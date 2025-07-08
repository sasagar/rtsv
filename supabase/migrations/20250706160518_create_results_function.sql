CREATE OR REPLACE FUNCTION get_question_results(q_id INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
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
        SELECT jsonb_agg(jsonb_build_object('id', id, 'text', answer_text, 'is_picked', is_picked))
        INTO results
        FROM (
            SELECT id, answer_text, is_picked
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