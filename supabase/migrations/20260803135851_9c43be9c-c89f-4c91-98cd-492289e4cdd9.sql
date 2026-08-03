GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_follows TO authenticated;
GRANT ALL ON public.operator_follows TO service_role;

GRANT SELECT ON public.quest_packs TO anon, authenticated;
GRANT ALL ON public.quest_packs TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.operator_quest_packs TO authenticated;
GRANT ALL ON public.operator_quest_packs TO service_role;

GRANT SELECT, INSERT, UPDATE ON public.reported_content TO authenticated;
GRANT ALL ON public.reported_content TO service_role;