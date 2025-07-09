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


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE OR REPLACE FUNCTION "public"."get_question_results"("q_id" integer) RETURNS "jsonb"
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    question_type_text TEXT;
    results JSONB;
BEGIN
    -- First, get the question type
    SELECT question_type INTO question_type_text
    FROM questions
    WHERE id = q_id;

    -- Aggregate results based on question type
    IF question_type_text = 'free-text' THEN
        SELECT jsonb_agg(jsonb_build_object('id', id, 'text', answer_text, 'is_picked', is_picked, 'is_hidden', is_hidden))
        INTO results
        FROM (
            SELECT id, answer_text, is_picked, is_hidden
            FROM answers
            WHERE question_id = q_id AND answer_text IS NOT NULL
            ORDER BY created_at DESC -- Order by creation to show latest answers first
        ) as sorted_answers;
    ELSE
        -- For multiple-choice and multiple-select
        SELECT jsonb_agg(jsonb_build_object('option', option, 'count', count))
        INTO results
        FROM (
            SELECT jsonb_array_elements_text(selected_options) as option, count(*)
            FROM answers
            WHERE question_id = q_id AND selected_options IS NOT NULL
            GROUP BY option
            ORDER BY count DESC
        ) as counts;
    END IF;

    RETURN COALESCE(results, '[]'::jsonb);
END;
$$;


ALTER FUNCTION "public"."get_question_results"("q_id" integer) OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."handle_new_user"() RETURNS "trigger"
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
BEGIN
  INSERT INTO public.profiles (id, email)
  VALUES (new.id, new.email);
  RETURN new;
END;
$$;


ALTER FUNCTION "public"."handle_new_user"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."signup_with_invite"("p_email" "text", "p_password" "text", "p_invite_code" "text") RETURNS json
    LANGUAGE "plpgsql" SECURITY DEFINER
    AS $$
DECLARE
  invite_id INT;
  new_user_id UUID;
BEGIN
  -- 招待コードを検証
  SELECT id INTO invite_id
  FROM public.invite_codes
  WHERE code = p_invite_code AND expires_at > NOW() AND uses < max_uses;

  IF invite_id IS NULL THEN
    RAISE EXCEPTION 'Invalid or expired invite code';
  END IF;

  -- ユーザーを登録
  INSERT INTO auth.users (email, password, raw_user_meta_data)
  VALUES (p_email, p_password, '{}'::jsonb)
  RETURNING id INTO new_user_id;

  -- 招待コードの使用回数をインクリメント
  UPDATE public.invite_codes
  SET uses = uses + 1
  WHERE id = invite_id;

  RETURN json_build_object('user_id', new_user_id);
END;
$$;


ALTER FUNCTION "public"."signup_with_invite"("p_email" "text", "p_password" "text", "p_invite_code" "text") OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."answers" (
    "id" integer NOT NULL,
    "question_id" integer,
    "session_id" "text" NOT NULL,
    "answer_text" "text",
    "selected_options" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "is_picked" boolean DEFAULT false,
    "is_hidden" boolean DEFAULT false
);


ALTER TABLE "public"."answers" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."answers_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."answers_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."answers_id_seq" OWNED BY "public"."answers"."id";



CREATE TABLE IF NOT EXISTS "public"."events" (
    "id" integer NOT NULL,
    "name" "text" NOT NULL,
    "access_code" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "user_id" "uuid",
    "background_color" "text" DEFAULT '#FFFFFF'::"text",
    "text_color" "text" DEFAULT '#000000'::"text"
);


ALTER TABLE "public"."events" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."events_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."events_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."events_id_seq" OWNED BY "public"."events"."id";



CREATE TABLE IF NOT EXISTS "public"."invite_codes" (
    "id" integer NOT NULL,
    "code" "text" NOT NULL,
    "max_uses" integer DEFAULT 1 NOT NULL,
    "uses" integer DEFAULT 0 NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL
);


ALTER TABLE "public"."invite_codes" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."invite_codes_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."invite_codes_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."invite_codes_id_seq" OWNED BY "public"."invite_codes"."id";



CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "email" character varying(255) NOT NULL
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."questions" (
    "id" integer NOT NULL,
    "event_id" integer,
    "text" "text" NOT NULL,
    "question_type" "text" NOT NULL,
    "options" "jsonb",
    "is_open" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "allow_multiple_answers" boolean DEFAULT false
);


ALTER TABLE "public"."questions" OWNER TO "postgres";


CREATE SEQUENCE IF NOT EXISTS "public"."questions_id_seq"
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."questions_id_seq" OWNER TO "postgres";


ALTER SEQUENCE "public"."questions_id_seq" OWNED BY "public"."questions"."id";



ALTER TABLE ONLY "public"."answers" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."answers_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."events" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."events_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."invite_codes" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."invite_codes_id_seq"'::"regclass");



ALTER TABLE ONLY "public"."questions" ALTER COLUMN "id" SET DEFAULT "nextval"('"public"."questions_id_seq"'::"regclass");



ALTER TABLE "public"."answers" DROP CONSTRAINT IF EXISTS "answers_pkey" CASCADE;
ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."events" DROP CONSTRAINT IF EXISTS "events_access_code_key" CASCADE;
ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_access_code_key" UNIQUE ("access_code");



ALTER TABLE "public"."events" DROP CONSTRAINT IF EXISTS "events_pkey" CASCADE;
ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."invite_codes" DROP CONSTRAINT IF EXISTS "invite_codes_code_key" CASCADE;
ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_code_key" UNIQUE ("code");



ALTER TABLE "public"."invite_codes" DROP CONSTRAINT IF EXISTS "invite_codes_pkey" CASCADE;
ALTER TABLE ONLY "public"."invite_codes"
    ADD CONSTRAINT "invite_codes_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_email_key" CASCADE;
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_email_key" UNIQUE ("email");



ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_pkey" CASCADE;
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."questions" DROP CONSTRAINT IF EXISTS "questions_pkey" CASCADE;
ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_pkey" PRIMARY KEY ("id");



ALTER TABLE "public"."answers" DROP CONSTRAINT IF EXISTS "answers_question_id_fkey";
ALTER TABLE ONLY "public"."answers"
    ADD CONSTRAINT "answers_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "public"."questions"("id") ON DELETE CASCADE;



ALTER TABLE "public"."events" DROP CONSTRAINT IF EXISTS "events_user_id_fkey";
ALTER TABLE ONLY "public"."events"
    ADD CONSTRAINT "events_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE "public"."profiles" DROP CONSTRAINT IF EXISTS "profiles_id_fkey";
ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE "public"."questions" DROP CONSTRAINT IF EXISTS "questions_event_id_fkey";
ALTER TABLE ONLY "public"."questions"
    ADD CONSTRAINT "questions_event_id_fkey" FOREIGN KEY ("event_id") REFERENCES "public"."events"("id") ON DELETE CASCADE;



DROP POLICY IF EXISTS "Users can delete their own events" ON "public"."events";
CREATE POLICY "Users can delete their own events" ON "public"."events" FOR DELETE USING (("auth"."uid"() = "user_id"));



DROP POLICY IF EXISTS "Users can insert events for themselves" ON "public"."events";



ALTER TABLE "public"."invite_codes" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";





GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



























































































































































GRANT ALL ON FUNCTION "public"."get_question_results"("q_id" integer) TO "anon";
GRANT ALL ON FUNCTION "public"."get_question_results"("q_id" integer) TO "authenticated";
GRANT ALL ON FUNCTION "public"."get_question_results"("q_id" integer) TO "service_role";



GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "anon";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."handle_new_user"() TO "service_role";



GRANT ALL ON FUNCTION "public"."signup_with_invite"("p_email" "text", "p_password" "text", "p_invite_code" "text") TO "anon";
GRANT ALL ON FUNCTION "public"."signup_with_invite"("p_email" "text", "p_password" "text", "p_invite_code" "text") TO "authenticated";
GRANT ALL ON FUNCTION "public"."signup_with_invite"("p_email" "text", "p_password" "text", "p_invite_code" "text") TO "service_role";


















GRANT ALL ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invite_codes" TO "anon";
GRANT ALL ON TABLE "public"."invite_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_codes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invite_codes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invite_codes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invite_codes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "service_role";









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
GRANT ALL ON TABLE "public"."answers" TO "anon";
GRANT ALL ON TABLE "public"."answers" TO "authenticated";
GRANT ALL ON TABLE "public"."answers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."answers_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."events" TO "anon";
GRANT ALL ON TABLE "public"."events" TO "authenticated";
GRANT ALL ON TABLE "public"."events" TO "service_role";



GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."events_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."invite_codes" TO "anon";
GRANT ALL ON TABLE "public"."invite_codes" TO "authenticated";
GRANT ALL ON TABLE "public"."invite_codes" TO "service_role";



GRANT ALL ON SEQUENCE "public"."invite_codes_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."invite_codes_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."invite_codes_id_seq" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."questions" TO "anon";
GRANT ALL ON TABLE "public"."questions" TO "authenticated";
GRANT ALL ON TABLE "public"."questions" TO "service_role";



GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "anon";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."questions_id_seq" TO "service_role";









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






























RESET ALL;

-- RLS Policies for profiles
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON "public"."profiles" FOR INSERT WITH CHECK (("auth"."uid"() = "id"));

DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view their own profile" ON "public"."profiles" FOR SELECT USING (("auth"."uid"() = "id"));

-- Cleanup any leftover debugging policies
DROP POLICY IF EXISTS "Super permissive insert for debugging" ON public.profiles;
DROP POLICY IF EXISTS "Permissive insert for debugging" ON public.profiles;
DROP POLICY IF EXISTS "Allow all inserts for debugging" ON public.profiles;
DROP POLICY IF EXISTS "Allow trigger to insert profile" ON public.profiles;

