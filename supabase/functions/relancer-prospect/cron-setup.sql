-- À exécuter dans Supabase > SQL Editor après avoir déployé la Edge Function.
-- Déclenche la fonction chaque jour à 8h00 UTC.
--
-- Prérequis : extensions pg_cron et pg_net activées
-- (Supabase > Database > Extensions > chercher "pg_cron" et "pg_net")

select cron.schedule(
  'relancer-prospect-quotidien',          -- nom du job (unique)
  '0 8 * * *',                            -- cron : tous les jours à 08:00 UTC
  $$
  select net.http_post(
    url     := 'https://bfqkuwbtqqyisjzrjqep.supabase.co/functions/v1/relancer-prospect',
    headers := jsonb_build_object(
      'Content-Type',  'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_role_key')
    ),
    body    := '{}'::jsonb
  )
  $$
);

-- Pour vérifier que le job est bien enregistré :
-- select * from cron.job;

-- Pour le supprimer si besoin :
-- select cron.unschedule('relancer-prospect-quotidien');
