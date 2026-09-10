CREATE TYPE "public"."campaign_type" AS ENUM('custom', 'nacional', 'saude', 'varejo', 'sazonal');--> statement-breakpoint
CREATE TYPE "public"."meeting_rsvp" AS ENUM('pendente', 'confirmado', 'declinado');--> statement-breakpoint
CREATE TYPE "public"."meeting_status" AS ENUM('agendada', 'confirmada', 'cancelada', 'realizada');--> statement-breakpoint
CREATE TYPE "public"."meeting_type" AS ENUM('operacional', 'estrategico');--> statement-breakpoint
CREATE TYPE "public"."task_priority" AS ENUM('urgent', 'week', 'later');--> statement-breakpoint
CREATE TYPE "public"."task_recurrence" AS ENUM('once', 'daily');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('pending', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."testimonial_file_type" AS ENUM('image', 'video');--> statement-breakpoint
CREATE TYPE "public"."training_audience" AS ENUM('client', 'marketer', 'all');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'marketer', 'client');--> statement-breakpoint
CREATE TABLE "access_logs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tenantId" integer,
	"action" varchar(64) DEFAULT 'login' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "campaigns" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"name" varchar(255) NOT NULL,
	"campType" "campaign_type" DEFAULT 'custom' NOT NULL,
	"startDate" date NOT NULL,
	"endDate" date NOT NULL,
	"tema" text,
	"acoes" text,
	"responsible" varchar(255),
	"alertsSent" text DEFAULT '[]',
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "dashboard_metrics" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"section" varchar(255) NOT NULL,
	"label" varchar(255) NOT NULL,
	"valueFrom" varchar(128),
	"valueTo" varchar(128),
	"deltaText" varchar(128),
	"growthPct" real,
	"orderIdx" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_comments" (
	"id" serial PRIMARY KEY NOT NULL,
	"insightId" integer NOT NULL,
	"userId" integer NOT NULL,
	"body" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insight_likes" (
	"id" serial PRIMARY KEY NOT NULL,
	"insightId" integer NOT NULL,
	"userId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "insights" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"body" text,
	"imageUrl" text,
	"authorId" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meeting_invites" (
	"id" serial PRIMARY KEY NOT NULL,
	"meetingId" integer NOT NULL,
	"userId" integer NOT NULL,
	"rsvp" "meeting_rsvp" DEFAULT 'pendente' NOT NULL,
	"respondedAt" timestamp,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "meetings" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"title" varchar(256) NOT NULL,
	"meetingType" "meeting_type" DEFAULT 'operacional' NOT NULL,
	"scheduledAt" timestamp NOT NULL,
	"durationMin" integer DEFAULT 60 NOT NULL,
	"agenda" text,
	"notes" text,
	"status" "meeting_status" DEFAULT 'agendada' NOT NULL,
	"createdBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategies" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text NOT NULL,
	"points" integer DEFAULT 70 NOT NULL,
	"icon" varchar(64) DEFAULT 'star' NOT NULL,
	"isDefault" boolean DEFAULT true NOT NULL,
	"orderIdx" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "strategy_completions" (
	"id" serial PRIMARY KEY NOT NULL,
	"strategyId" integer NOT NULL,
	"tenantId" integer NOT NULL,
	"completedBy" integer NOT NULL,
	"completedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "task_categories" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"icon" varchar(64) DEFAULT 'list',
	"position" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tasks" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"categoryId" integer,
	"name" varchar(512) NOT NULL,
	"status" "task_status" DEFAULT 'pending' NOT NULL,
	"priority" "task_priority" DEFAULT 'week' NOT NULL,
	"responsible" varchar(255),
	"responsibleUserId" integer,
	"position" integer DEFAULT 0,
	"recurrence" "task_recurrence" DEFAULT 'once' NOT NULL,
	"imageUrl" text,
	"link" text,
	"recurringDays" text,
	"alertCampaignId" integer,
	"alertDaysBefore" integer,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"plan" varchar(20) DEFAULT 'boi' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "testimonials" (
	"id" serial PRIMARY KEY NOT NULL,
	"tenantId" integer NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"fileUrl" text NOT NULL,
	"fileType" "testimonial_file_type" DEFAULT 'image' NOT NULL,
	"uploadedBy" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "trainings" (
	"id" serial PRIMARY KEY NOT NULL,
	"title" varchar(255) NOT NULL,
	"description" text,
	"videoUrl" text,
	"thumbnailUrl" text,
	"audience" "training_audience" DEFAULT 'all' NOT NULL,
	"category" varchar(128) DEFAULT 'Geral' NOT NULL,
	"orderIdx" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_settings" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tenantId" integer NOT NULL,
	"profileName" varchar(255),
	"headerColor" varchar(32) DEFAULT '#0B0F14',
	"accentColor" varchar(32) DEFAULT '#C9A227',
	"logoUrl" text,
	"bannerUrl" text,
	"twilioSid" varchar(128),
	"twilioToken" varchar(128),
	"twilioPhone" varchar(32),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "user_tenants" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tenantId" integer NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "user_role" DEFAULT 'client' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	"passwordHash" varchar(255),
	"mustChangePassword" boolean DEFAULT false NOT NULL,
	"avatarUrl" text,
	CONSTRAINT "users_openId_unique" UNIQUE("openId")
);
--> statement-breakpoint
CREATE TABLE "whatsapp_prefs" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tenantId" integer NOT NULL,
	"phone" varchar(32),
	"enabled" boolean DEFAULT false NOT NULL,
	"notifNovaTarefa" boolean DEFAULT false NOT NULL,
	"notifReuniao" boolean DEFAULT false NOT NULL,
	"notifResumoDiario" boolean DEFAULT false NOT NULL,
	"resumoHorario" varchar(5) DEFAULT '08:00' NOT NULL,
	"heartbeatUid" varchar(128),
	"lastDailySummaryDate" varchar(10),
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
