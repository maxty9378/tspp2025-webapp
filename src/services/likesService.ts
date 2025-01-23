import { supabase } from '../lib/supabase';

interface LikeResult {
  success: boolean;
  alreadyLiked?: boolean;
  newLikesCount: number;
  likesGiven: number;
  pointsAwarded: number;
  taskCompleted: boolean;
}

export async function addLike(targetUserId: string, currentUserId: string): Promise<LikeResult> {
  try {
    // Get current user data
    const { data: currentUserData, error: currentUserError } = await supabase
      .select('likes')
      .eq('id', currentUserId)
      .single();

    if (currentUserError) throw currentUserError;

    // Add like to target user
    const { data: updatedTarget, error: targetUpdateError } = await supabase
      .from('users')
      .rpc('add_like', {
        target_user_id: targetUserId,
        liker_id: currentUserId
      });

    if (targetUpdateError) throw targetUpdateError;

    return {
      success: true,
      newLikesCount: updatedTarget.liked_by?.length || 0,
      likesGiven: currentUserData.likes?.length || 0,
      pointsAwarded: 0,
      taskCompleted: false
    };

  } catch (error) {
    console.error('Error in addLike:', error);
    throw error;
  }
}