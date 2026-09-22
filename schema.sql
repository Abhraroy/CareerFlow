-- WARNING: This schema is for context only and is not meant to be run.
-- Table order and constraints may not be valid for execution.

CREATE TABLE public.users (
  id uuid NOT NULL,
  email text,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT users_pkey PRIMARY KEY (id),
  CONSTRAINT users_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id)
);
CREATE TABLE public.resumes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text,
  file_name text,
  file_size bigint CHECK (file_size IS NULL OR file_size >= 0),
  raw_resume_data text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  structured_data jsonb NOT NULL DEFAULT '{}'::jsonb,
  CONSTRAINT resumes_pkey PRIMARY KEY (id),
  CONSTRAINT resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.jobs (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  company_name text,
  job_title text NOT NULL,
  job_description text,
  job_link text,
  logo text,
  company_description text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT jobs_pkey PRIMARY KEY (id),
  CONSTRAINT jobs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.tailored_resumes (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL,
  resume_id uuid NOT NULL,
  job_id uuid NOT NULL,
  raw_tailored_resume_data text,
  tailored_based_on jsonb NOT NULL DEFAULT '{}'::jsonb,
  structured_output jsonb NOT NULL DEFAULT '{}'::jsonb,
  fit_score numeric NOT NULL DEFAULT 0 CHECK (fit_score >= 0::numeric AND fit_score <= 100::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT tailored_resumes_pkey PRIMARY KEY (id),
  CONSTRAINT tailored_resumes_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT tailored_resumes_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id),
  CONSTRAINT tailored_resumes_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id)
);
CREATE TABLE public.scores (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  resume_id uuid NOT NULL,
  fit_score numeric NOT NULL DEFAULT 0 CHECK (fit_score >= 0::numeric AND fit_score <= 100::numeric),
  potential_score numeric NOT NULL DEFAULT 0 CHECK (potential_score >= 0::numeric AND potential_score <= 100::numeric),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT scores_pkey PRIMARY KEY (id),
  CONSTRAINT scores_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT scores_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT scores_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id)
);
CREATE TABLE public.api_key_table (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  type text NOT NULL,
  hashed_api_key text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT api_key_table_pkey PRIMARY KEY (id),
  CONSTRAINT apikeytable_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id)
);
CREATE TABLE public.ai_usages (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  api_key_id uuid NOT NULL,
  feature text NOT NULL,
  model text NOT NULL,
  input_tokens integer NOT NULL DEFAULT 0 CHECK (input_tokens >= 0),
  output_tokens integer NOT NULL DEFAULT 0 CHECK (output_tokens >= 0),
  total_tokens integer NOT NULL DEFAULT 0 CHECK (total_tokens >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT ai_usages_pkey PRIMARY KEY (id),
  CONSTRAINT ai_usages_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT ai_usages_api_key_id_fkey FOREIGN KEY (api_key_id) REFERENCES public.api_key_table(id)
);
CREATE TABLE public.applications (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  resume_id uuid,
  tailored_resume_id uuid,
  shortlisted boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT applications_pkey PRIMARY KEY (id),
  CONSTRAINT applications_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.users(id),
  CONSTRAINT applications_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT applications_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id),
  CONSTRAINT applications_tailored_resume_id_fkey FOREIGN KEY (tailored_resume_id) REFERENCES public.tailored_resumes(id)
);
CREATE TABLE public.llm_analysis (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  job_id uuid NOT NULL,
  resume_id uuid,
  tailor_resume_id uuid,
  requirements jsonb NOT NULL DEFAULT '[]'::jsonb CHECK (jsonb_typeof(requirements) = 'array'::text),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT llm_analysis_pkey PRIMARY KEY (id),
  CONSTRAINT llm_analysis_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id),
  CONSTRAINT llm_analysis_job_id_fkey FOREIGN KEY (job_id) REFERENCES public.jobs(id),
  CONSTRAINT llm_analysis_resume_id_fkey FOREIGN KEY (resume_id) REFERENCES public.resumes(id),
  CONSTRAINT llm_analysis_tailor_resume_id_fkey FOREIGN KEY (tailor_resume_id) REFERENCES public.tailored_resumes(id)
);
CREATE TABLE public.requirement_interactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  llm_analysis_id uuid NOT NULL,
  user_id uuid NOT NULL,
  requirement_id text NOT NULL,
  requirement text NOT NULL,
  has_experience boolean NOT NULL DEFAULT false,
  user_evidence text,
  question text,
  hint text,
  answer text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT requirement_interactions_pkey PRIMARY KEY (id),
  CONSTRAINT requirement_interactions_llm_analysis_id_fkey FOREIGN KEY (llm_analysis_id) REFERENCES public.llm_analysis(id),
  CONSTRAINT requirement_interactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id)
);