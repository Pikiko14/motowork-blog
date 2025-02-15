/**
 * Main application file for the API
 */

// Imports
import path from "path";
import RoutesIndex from "./routes";
import cors, { CorsOptions } from "cors";
import Database from "../configuration/db";
import express, { Application } from "express";
import configuration from "../configuration/configuration";

// Classes
/**
 * The main application class
 */
export class Server {
  /** The Express application */
  private app: Application;
  /** The port the server should run on */
  private readonly PORT: number | string;
  /** The path to the route directory */
  private readonly routeDirectoryPath: string;
  /**The public path route */
  private readonly publicDirectoryPath: string;

  /**
   * Creates a new instance of the server
   */
  constructor() {
    this.app = express();
    // this.setupMessageBroker();
    this.PORT = parseInt(configuration.get("PORT")) || 3000; // Default port
    this.routeDirectoryPath = path.join(__dirname, "./routes"); // Path to your routes directory
    this.publicDirectoryPath = path.join(__dirname, "../uploads"); // Path to your public directory
  }

  /**
   * Configures the middleware for the Express application
   */
  private configureMiddleware(): void {
    const corsOptions: CorsOptions = {
      origin: [
        "http://localhost:9000",
        "http://localhost:9001",
        "http://localhost:9200",
        "http://testbanner.test",
        "https://app.motowork.xyz",
        "http://admin.motowork.xyz/",
        "https://admin.motowork.xyz",
        "http://app.motowork.xyz",
        "https://app.motowork.xyz",
      ],
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
      credentials: true,
      optionsSuccessStatus: 204,
    };
    this.app.use(express.json());
    this.app.use(cors(corsOptions));
    this.app.use(express.static(this.publicDirectoryPath));
    this.loadRoutes();
  }

  /**
   * Loads the routes for the application
   */
  private loadRoutes(): void {
    // Use the router
    const routes = new RoutesIndex();
    routes.loadRoutes();
    this.app.use(routes.getRouter());
  }

  /**
   * Set message broker
   */
  setupMessageBroker(): void {}

  /**
   * Starts the server
   */
  private async startServer(): Promise<void> {
    const db = new Database();
    await db.connect();
    this.app.listen(this.PORT, () =>
      console.log(`Running on port ${this.PORT}`)
    );
  }

  /**
   * Starts the server
   */
  public async start(): Promise<void> {
    this.configureMiddleware();
    await this.startServer();
  }
}

// Start the server
const server = new Server();
server.start();
