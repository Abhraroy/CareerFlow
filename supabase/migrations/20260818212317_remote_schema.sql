drop trigger if exists "jobs_updated_at" on "public"."jobs";

drop trigger if exists "resumes_updated_at" on "public"."resumes";

drop trigger if exists "scores_updated_at" on "public"."scores";

drop trigger if exists "tailored_resumes_updated_at" on "public"."tailored_resumes";

drop trigger if exists "users_updated_at" on "public"."users";

drop policy "Users can create their own API key records" on "public"."apikeytable";

drop policy "Users can view their own API key records" on "public"."apikeytable";

drop policy "Users can create their own AI usage" on "public"."ai_usages";

revoke delete on table "public"."apikeytable" from "anon";

revoke insert on table "public"."apikeytable" from "anon";

revoke references on table "public"."apikeytable" from "anon";

revoke select on table "public"."apikeytable" from "anon";

revoke trigger on table "public"."apikeytable" from "anon";

revoke truncate on table "public"."apikeytable" from "anon";

revoke update on table "public"."apikeytable" from "anon";

revoke delete on table "public"."apikeytable" from "authenticated";

revoke insert on table "public"."apikeytable" from "authenticated";

revoke references on table "public"."apikeytable" from "authenticated";

revoke select on table "public"."apikeytable" from "authenticated";

revoke trigger on table "public"."apikeytable" from "authenticated";

revoke truncate on table "public"."apikeytable" from "authenticated";

revoke update on table "public"."apikeytable" from "authenticated";

revoke delete on table "public"."apikeytable" from "service_role";

revoke insert on table "public"."apikeytable" from "service_role";

revoke references on table "public"."apikeytable" from "service_role";

revoke select on table "public"."apikeytable" from "service_role";

revoke trigger on table "public"."apikeytable" from "service_role";

revoke truncate on table "public"."apikeytable" from "service_role";

revoke update on table "public"."apikeytable" from "service_role";

alter table "public"."apikeytable" drop constraint "apikeytable_user_id_fkey";

alter table "public"."ai_usages" drop constraint "ai_usages_api_key_id_fkey";

alter table "public"."ai_usages" drop constraint "ai_usages_user_id_fkey";

alter table "public"."jobs" drop constraint "jobs_user_id_fkey";

alter table "public"."resumes" drop constraint "resumes_user_id_fkey";

alter table "public"."scores" drop constraint "scores_job_id_fkey";

alter table "public"."scores" drop constraint "scores_resume_id_fkey";

alter table "public"."scores" drop constraint "scores_user_id_fkey";

alter table "public"."tailored_resumes" drop constraint "tailored_resumes_job_id_fkey";

alter table "public"."tailored_resumes" drop constraint "tailored_resumes_resume_id_fkey";

alter table "public"."tailored_resumes" drop constraint "tailored_resumes_user_id_fkey";

alter table "public"."apikeytable" drop constraint "apikeytable_pkey";

drop index if exists "public"."apikeytable_hashed_api_key_idx";

drop index if exists "public"."apikeytable_pkey";

drop index if exists "public"."apikeytable_type_idx";

drop index if exists "public"."apikeytable_user_created_at_idx";

drop index if exists "public"."apikeytable_user_id_idx";

drop table "public"."apikeytable";


  create table "public"."api_key_table" (
    "id" uuid not null default gen_random_uuid(),
    "user_id" uuid not null,
    "type" text not null,
    "hashed_api_key" text,
    "created_at" timestamp with time zone not null default now()
      );


alter table "public"."api_key_table" enable row level security;

CREATE INDEX apikeytable_hashed_api_key_idx ON public.api_key_table USING btree (hashed_api_key) WHERE (hashed_api_key IS NOT NULL);

CREATE UNIQUE INDEX apikeytable_pkey ON public.api_key_table USING btree (id);

CREATE INDEX apikeytable_type_idx ON public.api_key_table USING btree (type);

CREATE INDEX apikeytable_user_created_at_idx ON public.api_key_table USING btree (user_id, created_at DESC);

CREATE INDEX apikeytable_user_id_idx ON public.api_key_table USING btree (user_id);

alter table "public"."api_key_table" add constraint "apikeytable_pkey" PRIMARY KEY using index "apikeytable_pkey";

alter table "public"."api_key_table" add constraint "apikeytable_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."api_key_table" validate constraint "apikeytable_user_id_fkey";

alter table "public"."ai_usages" add constraint "ai_usages_api_key_id_fkey" FOREIGN KEY (api_key_id) REFERENCES public.api_key_table(id) ON DELETE CASCADE not valid;

alter table "public"."ai_usages" validate constraint "ai_usages_api_key_id_fkey";

alter table "public"."ai_usages" add constraint "ai_usages_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."ai_usages" validate constraint "ai_usages_user_id_fkey";

alter table "public"."jobs" add constraint "jobs_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."jobs" validate constraint "jobs_user_id_fkey";

alter table "public"."resumes" add constraint "resumes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."resumes" validate constraint "resumes_user_id_fkey";

alter table "public"."scores" add constraint "scores_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_job_id_fkey";

alter table "public"."scores" add constraint "scores_resume_id_fkey" FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_resume_id_fkey";

alter table "public"."scores" add constraint "scores_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."scores" validate constraint "scores_user_id_fkey";

alter table "public"."tailored_resumes" add constraint "tailored_resumes_job_id_fkey" FOREIGN KEY (job_id) REFERENCES public.jobs(id) ON DELETE CASCADE not valid;

alter table "public"."tailored_resumes" validate constraint "tailored_resumes_job_id_fkey";

alter table "public"."tailored_resumes" add constraint "tailored_resumes_resume_id_fkey" FOREIGN KEY (resume_id) REFERENCES public.resumes(id) ON DELETE CASCADE not valid;

alter table "public"."tailored_resumes" validate constraint "tailored_resumes_resume_id_fkey";

alter table "public"."tailored_resumes" add constraint "tailored_resumes_user_id_fkey" FOREIGN KEY (user_id) REFERENCES public.users(id) ON DELETE CASCADE not valid;

alter table "public"."tailored_resumes" validate constraint "tailored_resumes_user_id_fkey";

grant delete on table "public"."api_key_table" to "anon";

grant insert on table "public"."api_key_table" to "anon";

grant references on table "public"."api_key_table" to "anon";

grant select on table "public"."api_key_table" to "anon";

grant trigger on table "public"."api_key_table" to "anon";

grant truncate on table "public"."api_key_table" to "anon";

grant update on table "public"."api_key_table" to "anon";

grant delete on table "public"."api_key_table" to "authenticated";

grant insert on table "public"."api_key_table" to "authenticated";

grant references on table "public"."api_key_table" to "authenticated";

grant select on table "public"."api_key_table" to "authenticated";

grant trigger on table "public"."api_key_table" to "authenticated";

grant truncate on table "public"."api_key_table" to "authenticated";

grant update on table "public"."api_key_table" to "authenticated";

grant delete on table "public"."api_key_table" to "service_role";

grant insert on table "public"."api_key_table" to "service_role";

grant references on table "public"."api_key_table" to "service_role";

grant select on table "public"."api_key_table" to "service_role";

grant trigger on table "public"."api_key_table" to "service_role";

grant truncate on table "public"."api_key_table" to "service_role";

grant update on table "public"."api_key_table" to "service_role";


  create policy "Users can create their own API key records"
  on "public"."api_key_table"
  as permissive
  for insert
  to authenticated
with check ((user_id = auth.uid()));



  create policy "Users can view their own API key records"
  on "public"."api_key_table"
  as permissive
  for select
  to authenticated
using ((user_id = auth.uid()));



  create policy "Users can create their own AI usage"
  on "public"."ai_usages"
  as permissive
  for insert
  to authenticated
with check (((user_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM public.api_key_table a
  WHERE ((a.id = ai_usages.api_key_id) AND (a.user_id = auth.uid()))))));


CREATE TRIGGER jobs_updated_at BEFORE UPDATE ON public.jobs FOR EACH ROW EXECUTE FUNCTION public.update_jobs_updated_at();

CREATE TRIGGER resumes_updated_at BEFORE UPDATE ON public.resumes FOR EACH ROW EXECUTE FUNCTION public.update_resumes_updated_at();

CREATE TRIGGER scores_updated_at BEFORE UPDATE ON public.scores FOR EACH ROW EXECUTE FUNCTION public.update_scores_updated_at();

CREATE TRIGGER tailored_resumes_updated_at BEFORE UPDATE ON public.tailored_resumes FOR EACH ROW EXECUTE FUNCTION public.update_tailored_resumes_updated_at();

CREATE TRIGGER users_updated_at BEFORE UPDATE ON public.users FOR EACH ROW EXECUTE FUNCTION public.update_users_updated_at();

drop trigger if exists "on_auth_user_created" on "auth"."users";

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


