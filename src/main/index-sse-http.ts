import express, { Request as ExpressRequest, Response, NextFunction } from 'express';
import { randomUUID } from "node:crypto";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import { z } from 'zod';
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { DataForSEOClient, DataForSEOConfig } from '../core/client/dataforseo.client.js';
import { EnabledModulesSchema, isModuleEnabled } from '../core/config/modules.config.js';
import { BaseModule, ToolDefinition } from '../core/modules/base.module.js';
import { name, version } from '../core/utils/version.js';
import { InMemoryEventStore } from '@modelcontextprotocol/sdk/examples/shared/inMemoryEventStore.js';
import { ModuleLoaderService } from '../core/utils/module-loader.js';
import { initializeFieldConfiguration } from '../core/config/field-configuration.js';

// Initialize field configuration if provided
initializeFieldConfiguration();
console.error('Starting DataForSEO MCP Server...');
console.error(`Server name: ${name}, version: ${version}`);

/**
 * This example server demonstrates backwards compatibility with both:
 * 1. The deprecated HTTP+SSE transport (protocol version 2024-11-05)
 * 2. The Streamable HTTP transport (protocol version 2025-03-26)
 * 
 * It maintains a single MCP server instance but exposes two transport options:
 * - /mcp: The new Streamable HTTP endpoint (supports GET/POST/DELETE)
 * - /sse: The deprecated SSE endpoint for older clients (GET to establish stream)
 * - /messages: The deprecated POST endpoint for older clients (POST to send messages)
 */

// Configuration constants
const CONNECTION_TIMEOUT = 30000; // 30 seconds
const CLEANUP_INTERVAL = 60000; // 1 minute

// Extended request interface to include auth properties
interface Request extends ExpressRequest {
  username?: string;
  password?: string;
}

// Transport interface with timestamp
interface TransportWithTimestamp {
  transport: StreamableHTTPServerTransport | SSEServerTransport;
  lastActivity: number;
}

// Store transports by session ID
const transports: Record<string, TransportWithTimestamp> = {};

// Cleanup function for stale connections
function cleanupStaleConnections() {
  const now = Date.now();
  Object.entries(transports).forEach(([sessionId, { transport, lastActivity }]) => {
    if (now - lastActivity > CONNECTION_TIMEOUT) {
      console.log(`Cleaning up stale connection for session ${sessionId}`);
      try {
        transport.close();
      } catch (error) {
        console.error(`Error closing transport for session ${sessionId}:`, error);
      }
      delete transports[sessionId];
    }
  });
}

// Start periodic cleanup
const cleanupInterval = setInterval(cleanupStaleConnections, CLEANUP_INTERVAL);

function getServer(username: string | undefined, password: string | undefined): McpServer {
  const server = new McpServer({
    name,
    version,
  }, { capabilities: { logging: {} } });

  // Initialize DataForSEO client
  const dataForSEOConfig: DataForSEOConfig = {
    username: username || "",
    password: password || "",
  };
  
  const dataForSEOClient = new DataForSEOClient(dataForSEOConfig);
  console.error('DataForSEO client initialized');
  
  // Parse enabled modules from environment
  const enabledModules = EnabledModulesSchema.parse(process.env.ENABLED_MODULES);
  
  // Initialize modules
  const modules: BaseModule[] = ModuleLoaderService.loadModules(dataForSEOClient, enabledModules);
  

  // Register module tools
  modules.forEach(module => {
    const tools = module.getTools();
    Object.entries(tools).forEach(([name, tool]) => {
      const typedTool = tool as ToolDefinition;
      const schema = z.object(typedTool.params);
      server.tool(
        name,
        typedTool.description,
        schema.shape,
        typedTool.handler
      );
    });
  });

  return server;
}

// Create Express application
const app = express();
app.use(express.json());

// Simple in-memory store for active SSE transports
const sseTransports: Record<string, SSEServerTransport> = {};

// Environment variables for DataForSEO credentials
const DATAFORSEO_USERNAME = process.env.DATAFORSEO_USERNAME;
const DATAFORSEO_PASSWORD = process.env.DATAFORSEO_PASSWORD;

// Basic Authentication Middleware
const basicAuth = (req: Request, res: Response, next: NextFunction): void => {
    try { 
        const authHeader = req.headers.authorization;
        if (authHeader) {
            const [type, credentialsB64] = authHeader.split(' ');
            if (type === 'Basic' && credentialsB64) {
                try {
                    const decoded = Buffer.from(credentialsB64, 'base64').toString();
                    const [username, password] = decoded.split(':');
                    if (username === DATAFORSEO_USERNAME && password === DATAFORSEO_PASSWORD) {
                        req.username = username; // Attach user to request for logging or other purposes
                        req.password = password;
                        return next();
                    }
                } catch (decodeError) {
                    console.error(`[Auth] Error decoding credentials for IP: ${req.socket.remoteAddress || 'unknown'}. Error:`, decodeError);
                    // Fall through to unauthorized response if DATAFORSEO_USERNAME is set
                }
            }
        }

        if (DATAFORSEO_USERNAME) { // Only enforce auth if username is configured
             console.log(`[Auth] Unauthorized attempt. IP: ${req.socket.remoteAddress || 'unknown'}. Auth Header: ${authHeader ? 'Present' : 'Missing or Malformed'}`);
            res.setHeader('WWW-Authenticate', 'Basic realm="Restricted Area"');
            res.status(401).send('Authentication required.');
            return;
        }
        
        // If DATAFORSEO_USERNAME is not set (e.g. for local dev without auth), allow access
        req.username = 'anonymous_fallback_auth_disabled'; 
        return next();

    } catch (authMiddlewareError) { 
        console.error(`[Auth] CRITICAL ERROR in basicAuth middleware for IP: ${req.socket.remoteAddress || 'unknown'}. Error:`, authMiddlewareError);
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error during auth.');
        } else if (res.socket && !res.socket.destroyed) {
            res.end(); // If headers sent and socket valid, just try to close the connection
        }
    }
};

//=============================================================================
// STREAMABLE HTTP TRANSPORT (PROTOCOL VERSION 2025-03-26)
//=============================================================================

const handleMcpRequest = async (req: Request, res: Response) => {
    // In stateless mode, create a new instance of transport and server for each request
    // to ensure complete isolation. A single instance would cause request ID collisions
    // when multiple clients connect concurrently.
    
    try {
      console.error(Date.now().toLocaleString())
      
    // Handle credentials
      if (!req.username && !req.password) {
        const envUsername = process.env.DATAFORSEO_USERNAME;
        const envPassword = process.env.DATAFORSEO_PASSWORD;
        if (!envUsername || !envPassword) {
          console.error('No DataForSEO credentials provided');
          res.status(401).json({
            jsonrpc: "2.0",
            error: {
              code: -32001,
              message: "Authentication required. Provide DataForSEO credentials."
            },
            id: null
          });
          return;
        }
        req.username = envUsername;
        req.password = envPassword;
      }
      
      const server = getServer(req.username, req.password); 
      console.error(Date.now().toLocaleString())

      const transport: StreamableHTTPServerTransport = new StreamableHTTPServerTransport({
        sessionIdGenerator: undefined
      });

      await server.connect(transport);
      console.error('handle request');
      await transport.handleRequest(req , res, req.body);
      console.error('end handle request');
      req.on('close', () => {
        console.error('Request closed');
        transport.close();
        server.close();
      });

    } catch (error) {
      console.error('Error handling MCP request:', error);
      if (!res.headersSent) {
        res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32603,
            message: 'Internal server error',
          },
          id: null,
        });
      }
    }
  };

const handleNotAllowed = (method: string) => async (req: Request, res: Response) => {
    console.error(`Received ${method} request`);
    res.status(405).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Method not allowed."
      },
      id: null
    });
  };

// Apply basic auth and shared handler to both endpoints
app.post('/http', basicAuth, handleMcpRequest);
app.post('/mcp', basicAuth, handleMcpRequest);

app.get('/http', handleNotAllowed('GET HTTP'));
app.get('/mcp', handleNotAllowed('GET MCP'));

app.delete('/http', handleNotAllowed('DELETE HTTP'));
app.delete('/mcp', handleNotAllowed('DELETE MCP'));

//=============================================================================
// DEPRECATED HTTP+SSE TRANSPORT (PROTOCOL VERSION 2024-11-05)
//=============================================================================

app.get('/sse', basicAuth, async (req: Request, res: Response) => {
    let keepAliveInterval: NodeJS.Timeout | null = null;
    const clientIp = req.ip || req.socket.remoteAddress || 'unknown_ip';
    let sessionId: string | null = null; // To hold session ID for logging in error cases

    try {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache, no-transform');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no'); // Advise proxies not to buffer

        const userForLog = req.username || 'anonymous_pre_transport';
        console.log(`[SSE /sse] New connection attempt. IP: ${clientIp}, User: ${userForLog}`);

        sessionId = randomUUID(); // Generate a unique session ID
        const transport = new SSEServerTransport('/', res);
        sseTransports[sessionId] = transport;
        
        // Store transport with timestamp
        transports[sessionId] = {
            transport: transport,
            lastActivity: Date.now()
        };

        // Connect server to transport
        const server = getServer(req.username, req.password);
        await server.connect(transport);

        console.log(`[SSE /sse] Connection established. Session ID: ${sessionId}, IP: ${clientIp}, User: ${userForLog}`);

        keepAliveInterval = setInterval(() => {
            // Check if transport still exists for this session and socket is writable
            if (sseTransports[sessionId!] && res.socket && !res.socket.destroyed) { 
                console.log(`[SSE /sse] Sending keep-alive ping. Session ID: ${sessionId}`);
                res.write(':ping\n\n'); // SSE comment to keep connection alive
            } else {
                if (keepAliveInterval) {
                    clearInterval(keepAliveInterval);
                    console.log(`[SSE /sse] Cleared keep-alive: transport missing or socket destroyed. Session ID: ${sessionId}`);
                }
            }
        }, 25000); // Send a ping every 25 seconds

        req.on('close', () => {
            console.log(`[SSE /sse] Connection closed by client. Session ID: ${sessionId}, IP: ${clientIp}, User: ${userForLog}`);
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                console.log(`[SSE /sse] Cleared keep-alive on req close. Session ID: ${sessionId}`);
            }
            if (sessionId && sseTransports[sessionId]) {
                try {
                    delete sseTransports[sessionId];
                    console.log(`[SSE /sse] Transport removed for Session ID: ${sessionId}. Active: ${Object.keys(sseTransports).length}`);
                } catch (cleanupError) {
                    console.error(`[SSE /sse] Error during transport deletion for Session ID ${sessionId}:`, cleanupError);
                }
            }
        });
        
        res.on('error', (err) => {
            console.error(`[SSE /sse] Response stream error. Session ID ${sessionId}, IP: ${clientIp}, User: ${userForLog}. Error:`, err);
            if (keepAliveInterval) {
                clearInterval(keepAliveInterval);
                console.log(`[SSE /sse] Cleared keep-alive on res error. Session ID: ${sessionId}`);
            }
            if (sessionId && sseTransports[sessionId]) {
                 try {
                    delete sseTransports[sessionId];
                } catch (e) { console.error(`[SSE /sse] Error deleting transport on res error for Session ID ${sessionId}:`, e); }
            }
        });

        console.log(`[SSE /sse] Sending initial 'endpoint' event. Session ID: ${sessionId}`);
        res.write(`event: endpoint\ndata: /messages?sessionId=${sessionId}\n\n`);
        console.log(`[SSE /sse] Initial 'endpoint' event sent. Session ID: ${sessionId}`);

    } catch (error)  {
        const userForLogError = req.username || 'anonymous_pre_transport_error';
        console.error(`[SSE /sse] CRITICAL ERROR in /sse handler. Session ID: ${sessionId || 'N/A'}, IP: ${clientIp}, User: ${userForLogError}. Error:`, error);
        if (keepAliveInterval) {
            clearInterval(keepAliveInterval);
        }
        if (!res.headersSent) {
            res.status(500).send('Internal Server Error in SSE handler.');
        } else if (res.socket && !res.socket.destroyed) { 
            res.end(); 
        }
    }
});

app.post("/messages", basicAuth, async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  
  // Handle credentials
  if (!req.username && !req.password) {
    const envUsername = process.env.DATAFORSEO_USERNAME;
    const envPassword = process.env.DATAFORSEO_PASSWORD;
    
    if (!envUsername || !envPassword) {
      res.status(401).json({
        jsonrpc: "2.0",
        error: {
          code: -32001,
          message: "Authentication required. Provide DataForSEO credentials."
        },
        id: null
      });
      return;
    }
    req.username = envUsername;
    req.password = envPassword;
  }

  const transportData = transports[sessionId];
  if (!transportData) {
    res.status(400).send('No transport found for sessionId');
    return;
  }

  if (!(transportData.transport instanceof SSEServerTransport)) {
    res.status(400).json({
      jsonrpc: '2.0',
      error: {
        code: -32000,
        message: 'Bad Request: Session exists but uses a different transport protocol',
      },
      id: null,
    });
    return;
  }

  // Update last activity timestamp
  transportData.lastActivity = Date.now();
  
  await transportData.transport.handlePostMessage(req, res, req.body);
});

// Start the server
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
const server = app.listen(PORT, () => {
  console.log(`DataForSEO MCP Server with SSE compatibility listening on port ${PORT}`);
  console.log(`
==============================================
SUPPORTED TRANSPORT OPTIONS:

1. Streamable Http (Protocol version: 2025-03-26)
   Endpoint: /http (POST)
   Endpoint: /mcp (POST)


2. Http + SSE (Protocol version: 2024-11-05)
   Endpoints: /sse (GET) and /messages (POST)
   Usage:
     - Establish SSE stream with GET to /sse
     - Send requests with POST to /messages?sessionId=<id>
==============================================
`);
});

// Handle server shutdown
process.on('SIGINT', async () => {
  console.log('Shutting down server...');
  
  // Clear cleanup interval
  clearInterval(cleanupInterval);

  // Close HTTP server
  server.close();

  // Close all active transports
  for (const sessionId in transports) {
    try {
      console.log(`Closing transport for session ${sessionId}`);
      await transports[sessionId].transport.close();
      delete transports[sessionId];
    } catch (error) {
      console.error(`Error closing transport for session ${sessionId}:`, error);
    }
  }
  console.log('Server shutdown complete');
  process.exit(0);
});