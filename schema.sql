
\restrict vlqjgm7AqaPO5GJ30g649LttWcpM6f9yOx3Kww6YazRQ4lN2qAA4tyZjC9aCNir


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."agent_metrics" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid",
    "period_start" "date" NOT NULL,
    "period_end" "date" NOT NULL,
    "total_gci" numeric,
    "total_deal_volume" numeric,
    "deals_closed" integer,
    "deals_in_pipeline" integer,
    "average_days_to_close" integer,
    "performance_score" numeric,
    "data_refreshed_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."agent_metrics" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."agents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "full_name" "text" NOT NULL,
    "email" "text" NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "default_split_percent" double precision,
    "annual_cap_amount" double precision,
    "brokerage_id" "uuid" NOT NULL,
    "team_name" "text",
    "manager_id" "uuid",
    "focus_tags" "jsonb" DEFAULT '[]'::"jsonb",
    "default_bank_account_id" "uuid"
);


ALTER TABLE "public"."agents" OWNER TO "postgres";


COMMENT ON TABLE "public"."agents" IS 'Stores agent-specific information and business rules like default splits and caps.';



CREATE TABLE IF NOT EXISTS "public"."brokerages" (
    "brokerage_name" "text",
    "franchise_fee_percent" double precision,
    "eo_insurance_fee" double precision,
    "transaction_fee" double precision,
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "ach_provider" "text",
    "ach_config" "jsonb" DEFAULT '{}'::"jsonb"
);


ALTER TABLE "public"."brokerages" OWNER TO "postgres";


COMMENT ON TABLE "public"."brokerages" IS 'A singleton table containing global, brokerage-wide fees and settings.';



CREATE TABLE IF NOT EXISTS "public"."commission_checklists" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid",
    "item_key" "text" NOT NULL,
    "status" "text" DEFAULT 'missing'::"text",
    "validated_by" "uuid",
    "validated_at" timestamp with time zone,
    "notes" "text"
);


ALTER TABLE "public"."commission_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commission_documents" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid",
    "doc_type" "text" NOT NULL,
    "storage_path" "text" NOT NULL,
    "uploaded_by" "uuid",
    "uploaded_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "checksum" "text",
    "status" "text" DEFAULT 'uploaded'::"text"
);


ALTER TABLE "public"."commission_documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."commission_evidences" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "document_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "extraction_data" "jsonb" NOT NULL,
    "confidence" numeric,
    "requires_review" boolean DEFAULT false
);


ALTER TABLE "public"."commission_evidences" OWNER TO "postgres";


COMMENT ON TABLE "public"."commission_evidences" IS 'Stores a complete JSON snapshot of all data extracted from a single source document.';



CREATE TABLE IF NOT EXISTS "public"."commission_payouts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid",
    "agent_id" "uuid",
    "batch_id" "uuid",
    "payout_amount" numeric NOT NULL,
    "status" "text" DEFAULT 'ready'::"text",
    "auto_ach" boolean DEFAULT false,
    "ach_provider" "text",
    "ach_reference" "text",
    "scheduled_at" timestamp with time zone,
    "paid_at" timestamp with time zone,
    "failure_reason" "text",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."commission_payouts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."deal_stage_snapshots" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid",
    "stage" "text" NOT NULL,
    "entered_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "exited_at" timestamp with time zone,
    "stalled" boolean DEFAULT false
);


ALTER TABLE "public"."deal_stage_snapshots" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."evidence" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "field_name" "text",
    "field_value_text" "text",
    "source_snippet" "text",
    "source_email_url" "text",
    "detected_conflicts" "jsonb",
    "document_id" "uuid",
    "extraction_method" "text",
    "confidence_before_override" numeric
);


ALTER TABLE "public"."evidence" OWNER TO "postgres";


COMMENT ON TABLE "public"."evidence" IS 'Stores every raw piece of data extracted from a source, linked to a transaction.';



CREATE TABLE IF NOT EXISTS "public"."payout_bank_accounts" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid",
    "account_nickname" "text",
    "mask" "text",
    "provider_reference" "text",
    "is_default" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payout_bank_accounts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_batches" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "accountant_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_amount" numeric,
    "auto_ach_enabled" boolean DEFAULT false,
    "status" "text" DEFAULT 'pending'::"text"
);


ALTER TABLE "public"."payout_batches" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."payout_failures" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "payout_id" "uuid",
    "provider_code" "text",
    "provider_message" "text",
    "occurred_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."payout_failures" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transaction_events" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "transaction_id" "uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "event_type" "text" NOT NULL,
    "actor_id" "uuid",
    "actor_name" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "visible_to_agent" boolean DEFAULT true NOT NULL,
    "related_extraction_id" "uuid"
);


ALTER TABLE "public"."transaction_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "agent_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "status" "text" DEFAULT 'Needs Review'::"text" NOT NULL,
    "property_address" "text",
    "final_buyer_name" "text",
    "final_seller_name" "text",
    "final_sale_price" double precision,
    "final_lease_monthly_rent" double precision,
    "final_lease_term_months" integer,
    "final_listing_commission_percent" double precision,
    "final_buyer_commission_percent" double precision,
    "final_agent_split_percent" double precision,
    "final_co_broker_agent_name" "text",
    "final_co_brokerage_firm_name" "text",
    "final_referrals" "jsonb",
    "resolution_note" "text",
    "brokerage_id" "uuid" NOT NULL,
    "intake_status" "text" DEFAULT 'draft'::"text",
    "confidence_state" "text",
    "checklist_state" "text",
    "gci_verified_at" timestamp with time zone,
    "gci_verification_source" "text",
    "pending_payout_amount" numeric,
    "latest_payout_id" "uuid",
    "data_freshness_at" timestamp with time zone
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON TABLE "public"."transactions" IS 'The central record for a deal, containing the final, verified values.';



COMMENT ON COLUMN "public"."transactions"."property_address" IS 'The final, verified address, used as the primary human-readable identifier.';



ALTER TABLE ONLY "public"."agent_metrics"
    ADD CONSTRAINT "agent_metrics_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."brokerages"
    ADD CONSTRAINT "brokerages_brokerage_name_key" UNIQUE ("brokerage_name");



ALTER TABLE ONLY "public"."brokerages"
    ADD CONSTRAINT "brokerages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_checklists"
    ADD CONSTRAINT "commission_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_documents"
    ADD CONSTRAINT "commission_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_evidences"
    ADD CONSTRAINT "commission_evidences_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."commission_payouts"
    ADD CONSTRAINT "commission_payouts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."deal_stage_snapshots"
    ADD CONSTRAINT "deal_stage_snapshots_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_bank_accounts"
    ADD CONSTRAINT "payout_bank_accounts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_batches"
    ADD CONSTRAINT "payout_batches_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."payout_failures"
    ADD CONSTRAINT "payout_failures_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transaction_events"
    ADD CONSTRAINT "transaction_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



CREATE INDEX "commission_evidences_document_id_idx" ON "public"."commission_evidences" USING "btree" ("document_id");



CREATE INDEX "commission_evidences_transaction_id_idx" ON "public"."commission_evidences" USING "btree" ("transaction_id");



CREATE INDEX "evidence_transaction_id_idx" ON "public"."evidence" USING "btree" ("transaction_id");



CREATE INDEX "idx_agents_brokerage_id" ON "public"."agents" USING "btree" ("brokerage_id");



CREATE INDEX "idx_transactions_brokerage_id" ON "public"."transactions" USING "btree" ("brokerage_id");



CREATE INDEX "transaction_events_transaction_id_idx" ON "public"."transaction_events" USING "btree" ("transaction_id");



CREATE INDEX "transactions_agent_id_idx" ON "public"."transactions" USING "btree" ("agent_id");



ALTER TABLE ONLY "public"."agent_metrics"
    ADD CONSTRAINT "agent_metrics_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_default_bank_account_id_fkey" FOREIGN KEY ("default_bank_account_id") REFERENCES "public"."payout_bank_accounts"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "agents_manager_id_fkey" FOREIGN KEY ("manager_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."commission_checklists"
    ADD CONSTRAINT "commission_checklists_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_documents"
    ADD CONSTRAINT "commission_documents_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_evidences"
    ADD CONSTRAINT "commission_evidences_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."commission_documents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."commission_evidences"
    ADD CONSTRAINT "commission_evidences_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."commission_payouts"
    ADD CONSTRAINT "commission_payouts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."commission_payouts"
    ADD CONSTRAINT "commission_payouts_batch_id_fkey" FOREIGN KEY ("batch_id") REFERENCES "public"."payout_batches"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."commission_payouts"
    ADD CONSTRAINT "commission_payouts_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."deal_stage_snapshots"
    ADD CONSTRAINT "deal_stage_snapshots_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."commission_documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."evidence"
    ADD CONSTRAINT "evidence_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."agents"
    ADD CONSTRAINT "fk_agent_brokerage" FOREIGN KEY ("brokerage_id") REFERENCES "public"."brokerages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "fk_brokerage" FOREIGN KEY ("brokerage_id") REFERENCES "public"."brokerages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "fk_transaction_brokerage" FOREIGN KEY ("brokerage_id") REFERENCES "public"."brokerages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_bank_accounts"
    ADD CONSTRAINT "payout_bank_accounts_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."payout_failures"
    ADD CONSTRAINT "payout_failures_payout_id_fkey" FOREIGN KEY ("payout_id") REFERENCES "public"."commission_payouts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transaction_events"
    ADD CONSTRAINT "transaction_events_related_extraction_id_fkey" FOREIGN KEY ("related_extraction_id") REFERENCES "public"."commission_evidences"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transaction_events"
    ADD CONSTRAINT "transaction_events_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_agent_id_fkey" FOREIGN KEY ("agent_id") REFERENCES "public"."agents"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_latest_payout_id_fkey" FOREIGN KEY ("latest_payout_id") REFERENCES "public"."commission_payouts"("id") ON DELETE SET NULL;



ALTER TABLE "public"."agents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."commission_evidences" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."evidence" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transaction_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";








































































































































































GRANT ALL ON TABLE "public"."agent_metrics" TO "anon";
GRANT ALL ON TABLE "public"."agent_metrics" TO "authenticated";
GRANT ALL ON TABLE "public"."agent_metrics" TO "service_role";



GRANT ALL ON TABLE "public"."agents" TO "anon";
GRANT ALL ON TABLE "public"."agents" TO "authenticated";
GRANT ALL ON TABLE "public"."agents" TO "service_role";



GRANT ALL ON TABLE "public"."brokerages" TO "anon";
GRANT ALL ON TABLE "public"."brokerages" TO "authenticated";
GRANT ALL ON TABLE "public"."brokerages" TO "service_role";



GRANT ALL ON TABLE "public"."commission_checklists" TO "anon";
GRANT ALL ON TABLE "public"."commission_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."commission_documents" TO "anon";
GRANT ALL ON TABLE "public"."commission_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_documents" TO "service_role";



GRANT ALL ON TABLE "public"."commission_evidences" TO "anon";
GRANT ALL ON TABLE "public"."commission_evidences" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_evidences" TO "service_role";



GRANT ALL ON TABLE "public"."commission_payouts" TO "anon";
GRANT ALL ON TABLE "public"."commission_payouts" TO "authenticated";
GRANT ALL ON TABLE "public"."commission_payouts" TO "service_role";



GRANT ALL ON TABLE "public"."deal_stage_snapshots" TO "anon";
GRANT ALL ON TABLE "public"."deal_stage_snapshots" TO "authenticated";
GRANT ALL ON TABLE "public"."deal_stage_snapshots" TO "service_role";



GRANT ALL ON TABLE "public"."evidence" TO "anon";
GRANT ALL ON TABLE "public"."evidence" TO "authenticated";
GRANT ALL ON TABLE "public"."evidence" TO "service_role";



GRANT ALL ON TABLE "public"."payout_bank_accounts" TO "anon";
GRANT ALL ON TABLE "public"."payout_bank_accounts" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_bank_accounts" TO "service_role";



GRANT ALL ON TABLE "public"."payout_batches" TO "anon";
GRANT ALL ON TABLE "public"."payout_batches" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_batches" TO "service_role";



GRANT ALL ON TABLE "public"."payout_failures" TO "anon";
GRANT ALL ON TABLE "public"."payout_failures" TO "authenticated";
GRANT ALL ON TABLE "public"."payout_failures" TO "service_role";



GRANT ALL ON TABLE "public"."transaction_events" TO "anon";
GRANT ALL ON TABLE "public"."transaction_events" TO "authenticated";
GRANT ALL ON TABLE "public"."transaction_events" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";






























\unrestrict vlqjgm7AqaPO5GJ30g649LttWcpM6f9yOx3Kww6YazRQ4lN2qAA4tyZjC9aCNir

RESET ALL;
