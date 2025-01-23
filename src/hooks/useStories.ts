import { useState, useEffect } from 'react';
import { supabase, withConnection } from '../lib/supabase';
import { Story } from '../types/stories';
import { showNotification } from '../utils/notifications';

const STORIES_CACHE_KEY = 'stories_cache';
const CACHE_DURATION = 2 * 60 * 1000; // 2 minutes

function getCachedStories(): { data: Story[]; timestamp: number } | null {
  try {
    const cached = localStorage.getItem(STORIES_CACHE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Date.now() - parsed.timestamp < CACHE_DURATION) {
        return parsed;
      }
    }
  } catch (error) {
    console.error('Cache error:', error);
  }
  return null;
}

function sortStoriesByPopularity(stories: Story[]): Story[] {
  return [...stories].sort((a, b) => {
    const aLikes = a.slides.reduce((sum, slide) => sum + slide.likes, 0);
    const bLikes = b.slides.reduce((sum, slide) => sum + slide.likes, 0);
    // First sort by date, then by likes for equal timestamps
    const dateCompare = new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    return dateCompare === 0 ? bLikes - aLikes : dateCompare;
  });
}

function setCachedStories(stories: Story[]) {
  try {
    localStorage.setItem(
      STORIES_CACHE_KEY,
      JSON.stringify({
        data: stories,
        timestamp: Date.now(),
      })
    );
  } catch (error) {
    console.error('Cache set error:', error);
  }
}

export function useStories() {
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;


    // Then fetch fresh data
    const fetchStories = async (retryCount = 0) => {
      try {
        const now = new Date().toISOString();
        const { data: storiesData, error: storiesError } = await withConnection(() => supabase
          .from('stories')
          .select(`
            id,
            created_at,
            expires_at,
            viewed,
            hashtag,
            user:users (
              id,
              first_name,
              last_name,
              photo_url,
              username
            ),
            slides:story_slides (
              id,
              media_url,
              media_type,
              created_at,
              likes,
              liked_by
            )
          `)
          .gt('expires_at', now)
          .order('created_at', { ascending: false })
          .limit(50));

        if (storiesError) throw storiesError;

        if (mounted && storiesData) {
          // Sort by date and mark popular stories
          const processedStories = storiesData.map(story => {
            const totalLikes = story.slides?.reduce((sum, slide) => sum + (slide.likes || 0), 0) || 0;
            return {
              ...story,
              isPopular: totalLikes >= 10 // Mark as popular if has 10+ likes
            };
          });
          setStories(processedStories);
          setCachedStories(storiesData);
          setError(null);
        }
      } catch (error) {
        console.error('Error fetching stories:', error);
        if (mounted) {
          setError('Failed to load stories');
          if (retryCount < 3) {
            setTimeout(() => fetchStories(retryCount + 1), 2000);
          } else {
            showNotification({
              title: 'Ошибка',
              message: 'Не удалось загрузить истории',
              type: 'error'
            });
          }
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Use cached stories immediately if available
    const cached = getCachedStories();
    if (cached) {
      setStories(cached.data);
      setLoading(false);
    }

    fetchStories();

    // Refresh stories periodically
    const interval = setInterval(fetchStories, 30000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  return { stories, loading, error };
}