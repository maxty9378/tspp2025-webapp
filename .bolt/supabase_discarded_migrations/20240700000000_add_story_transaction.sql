-- Create function to handle story creation with transaction
CREATE OR REPLACE FUNCTION create_story_with_slide(
  p_user_id TEXT,
  p_hashtag TEXT,
  p_is_admin BOOLEAN,
  p_media_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
AS $$
DECLARE
  v_story_id UUID;
  v_expires_at TIMESTAMP WITH TIME ZONE;
  v_story JSONB;
BEGIN
  -- Begin transaction
  BEGIN
    -- Set expiration time
    v_expires_at := NOW() + INTERVAL '24 hours';

    -- Insert story
    INSERT INTO stories (
      user_id,
      expires_at,
      hashtag,
      is_admin_post
    ) VALUES (
      p_user_id,
      v_expires_at,
      p_hashtag,
      p_is_admin
    )
    RETURNING id INTO v_story_id;

    -- Insert slide
    INSERT INTO story_slides (
      story_id,
      media_url,
      media_type,
      likes,
      liked_by
    ) VALUES (
      v_story_id,
      p_media_url,
      'image',
      0,
      ARRAY[]::TEXT[]
    );

    -- Get complete story data
    SELECT jsonb_build_object(
      'id', s.id,
      'user_id', s.user_id,
      'expires_at', s.expires_at,
      'hashtag', s.hashtag,
      'is_admin_post', s.is_admin_post,
      'slides', jsonb_agg(
        jsonb_build_object(
          'id', ss.id,
          'media_url', ss.media_url,
          'media_type', ss.media_type,
          'likes', ss.likes,
          'liked_by', ss.liked_by
        )
      )
    )
    INTO v_story
    FROM stories s
    LEFT JOIN story_slides ss ON ss.story_id = s.id
    WHERE s.id = v_story_id
    GROUP BY s.id;

    RETURN v_story;
  EXCEPTION
    WHEN OTHERS THEN
      RAISE;
  END;
END;
$$;