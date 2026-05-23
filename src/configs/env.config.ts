import dotenv from "dotenv";
dotenv.config({ override: true });

function env(key: string, fallback = ""): string {
    return (process.env[key] ?? fallback).trim();
}

class Config {
    private static instance: Config;

    // ── App ──────────────────────────────────────────────────────────────────
    readonly MODE:         "development" | "production" | "deployed";
    readonly BACKEND_PORT: number;
    readonly CLIENT_PORT:  number;

    readonly API_ACCESS:  string;
    readonly JWT_SECRET:  string;

    // ── URLs ─────────────────────────────────────────────────────────────────
    readonly DEPLOYED_FRONTEND_URL: string;
    readonly DEPLOYED_BACKEND_URL:  string;

    // ── Targets ──────────────────────────────────────────────────────────────
    readonly TARGET_DATABASE: string;
    readonly TARGET_EMAIL:    string;
    readonly TARGET_STORAGE:  string;
    readonly TARGET_CACHE:    string;
    readonly TARGET_QUEUE:    string;
    readonly TARGET_SOCKET:   string;

    // ── Database ─────────────────────────────────────────────────────────────
    readonly PSQL_DATABASE_DEVELOPMENT: string;
    readonly PSQL_DATABASE_PRODUCTION:  string;
    readonly PSQL_DATABASE_DEPLOYED:    string;
    readonly PSQL_DATABASE_ELECTRON:    string;

    // ── Email — Resend ────────────────────────────────────────────────────────
    readonly RESEND_EMAIL_API_KEY: string;
    readonly RESEND_EMAIL_FROM:    string;

    // ── Email — Nodemailer ────────────────────────────────────────────────────
    readonly NODEMAILER_EMAIL_SMTP_HOST: string;
    readonly NODEMAILER_EMAIL_SMTP_PORT: number;
    readonly NODEMAILER_EMAIL_SMTP_USER: string;
    readonly NODEMAILER_EMAIL_SMTP_PASS: string;
    readonly NODEMAILER_EMAIL_FROM:      string;

    // ── Storage — Cloudinary ──────────────────────────────────────────────────
    readonly CLOUDINARY_CLOUD_NAME: string;
    readonly CLOUDINARY_API_KEY:    string;
    readonly CLOUDINARY_API_SECRET: string;

    // ── Storage — Local ───────────────────────────────────────────────────────
    readonly LOCAL_STORAGE_PATH: string;

    // ── Cache — Redis ─────────────────────────────────────────────────────────
    readonly REDIS_CACHE_DEVELOPMENT: string;
    readonly REDIS_CACHE_PRODUCTION:  string;
    readonly REDIS_CACHE_DEPLOYED:    string;
    readonly REDIS_CACHE_ELECTRON:    string;

    // ── Queue — BullMQ ────────────────────────────────────────────────────────
    readonly BULLMQ_QUEUE_DEVELOPMENT: string;
    readonly BULLMQ_QUEUE_PRODUCTION:  string;
    readonly BULLMQ_QUEUE_DEPLOYED:    string;
    readonly BULLMQ_QUEUE_ELECTRON:    string;

    // ─────────────────────────────────────────────────────────────────────────
    private constructor() {
        // App
        this.MODE         = env("MODE", "development") as Config["MODE"];
        this.BACKEND_PORT = parseInt(env("BACKEND_PORT", "3000"), 10);
        this.CLIENT_PORT  = parseInt(env("CLIENT_PORT", "5173"),  10);

        this.API_ACCESS = env("API_ACCESS");
        this.JWT_SECRET = env("JWT_SECRET");

        // URLs
        this.DEPLOYED_FRONTEND_URL = env("DEPLOYED_FRONTEND_URL");
        this.DEPLOYED_BACKEND_URL  = env("DEPLOYED_BACKEND_URL");

        // Targets
        this.TARGET_DATABASE = env("TARGET_DATABASE", "psql");
        this.TARGET_EMAIL    = env("TARGET_EMAIL",    "nodemailer");
        this.TARGET_STORAGE  = env("TARGET_STORAGE",  "local");
        this.TARGET_CACHE    = env("TARGET_CACHE",    "redis");
        this.TARGET_QUEUE    = env("TARGET_QUEUE",    "bullmq");
        this.TARGET_SOCKET   = env("TARGET_SOCKET",   "socketio");

        // Database
        this.PSQL_DATABASE_DEVELOPMENT = env("PSQL_DATABASE_DEVELOPMENT");
        this.PSQL_DATABASE_PRODUCTION  = env("PSQL_DATABASE_PRODUCTION");
        this.PSQL_DATABASE_DEPLOYED    = env("PSQL_DATABASE_DEPLOYED");
        this.PSQL_DATABASE_ELECTRON    = env("PSQL_DATABASE_ELECTRON");

        // Email — Resend
        this.RESEND_EMAIL_API_KEY = env("RESEND_EMAIL_API_KEY");
        this.RESEND_EMAIL_FROM    = env("RESEND_EMAIL_FROM");

        // Email — Nodemailer
        this.NODEMAILER_EMAIL_SMTP_HOST = env("NODEMAILER_EMAIL_SMTP_HOST", "smtp.gmail.com");
        this.NODEMAILER_EMAIL_SMTP_PORT = parseInt(env("NODEMAILER_EMAIL_SMTP_PORT", "587"), 10);
        this.NODEMAILER_EMAIL_SMTP_USER = env("NODEMAILER_EMAIL_SMTP_USER");
        this.NODEMAILER_EMAIL_SMTP_PASS = env("NODEMAILER_EMAIL_SMTP_PASS");
        this.NODEMAILER_EMAIL_FROM      = env("NODEMAILER_EMAIL_FROM", env("NODEMAILER_EMAIL_SMTP_USER", "onboarding@resend.dev"));

        // Storage — Cloudinary
        this.CLOUDINARY_CLOUD_NAME = env("CLOUDINARY_CLOUD_NAME");
        this.CLOUDINARY_API_KEY    = env("CLOUDINARY_API_KEY");
        this.CLOUDINARY_API_SECRET = env("CLOUDINARY_API_SECRET");

        // Storage — Local
        this.LOCAL_STORAGE_PATH = env("LOCAL_STORAGE_PATH", "uploads");

        // Cache
        this.REDIS_CACHE_DEVELOPMENT = env("REDIS_CACHE_DEVELOPMENT", "redis://localhost:6379");
        this.REDIS_CACHE_PRODUCTION  = env("REDIS_CACHE_PRODUCTION");
        this.REDIS_CACHE_DEPLOYED    = env("REDIS_CACHE_DEPLOYED");
        this.REDIS_CACHE_ELECTRON    = env("REDIS_CACHE_ELECTRON", "redis://localhost:6379");

        // Queue
        this.BULLMQ_QUEUE_DEVELOPMENT = env("BULLMQ_QUEUE_DEVELOPMENT", "redis://localhost:6379");
        this.BULLMQ_QUEUE_PRODUCTION  = env("BULLMQ_QUEUE_PRODUCTION");
        this.BULLMQ_QUEUE_DEPLOYED    = env("BULLMQ_QUEUE_DEPLOYED");
        this.BULLMQ_QUEUE_ELECTRON    = env("BULLMQ_QUEUE_ELECTRON", "redis://localhost:6379");
    }

    static getInstance(): Config {
        if (!Config.instance) Config.instance = new Config();
        return Config.instance;
    }

    // ── Convenience getters that resolve the active MODE value ────────────────

    get PSQL_DATABASE(): string {
        const map = {
            development: this.PSQL_DATABASE_DEVELOPMENT,
            production:  this.PSQL_DATABASE_PRODUCTION,
            deployed:    this.PSQL_DATABASE_DEPLOYED,
            electron:    this.PSQL_DATABASE_ELECTRON,
        };
        return map[this.MODE];
    }

    get REDIS_CACHE_URL(): string {
        const map = {
            development: this.REDIS_CACHE_DEVELOPMENT,
            production:  this.REDIS_CACHE_PRODUCTION,
            deployed:    this.REDIS_CACHE_DEPLOYED,
            electron:    this.REDIS_CACHE_ELECTRON,
        };
        return map[this.MODE];
    }

    get BULLMQ_QUEUE_URL(): string {
        const map = {
            development: this.BULLMQ_QUEUE_DEVELOPMENT,
            production:  this.BULLMQ_QUEUE_PRODUCTION,
            deployed:    this.BULLMQ_QUEUE_DEPLOYED,
            electron:    this.BULLMQ_QUEUE_ELECTRON,
        };
        return map[this.MODE];
    }
}

export default Config.getInstance();