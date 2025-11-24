import React, { useState, useEffect } from 'react';
import { Activity } from 'lucide-react';
import { db } from '../../lib/database';
import { ActivityLog } from '../../types/database';
import { toast } from 'react-hot-toast';

interface ActivityFeedProps {
  targetType: string;
  targetId: string;
}

export function ActivityFeed({ targetType, targetId }: ActivityFeedProps) {
  const [activities, setActivities] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivities();
  }, [targetType, targetId]);

  const fetchActivities = async () => {
    try {
      const activities = await db.getActivityLogs(targetType, targetId);
      setActivities(activities);
    } catch (error) {
      console.error('Error fetching activities:', error);
      toast.error('Failed to load activity feed');
    } finally {
      setLoading(false);
    }
  };

  const formatAction = (activity: ActivityLog) => {
    const actorName = activity.actor?.name || 'Anonymous';
    
    switch (activity.action) {
      case 'created':
        return `${actorName} created this ${targetType}`;
      case 'updated':
        return `${actorName} updated this ${targetType}`;
      case 'assigned':
        return `${actorName} assigned this ${targetType}`;
      case 'status_changed':
        return `${actorName} changed status from "${activity.before_data?.status}" to "${activity.after_data?.status}"`;
      case 'moved':
        return `${actorName} moved task from "${activity.before_data?.stage}" to "${activity.after_data?.stage}"`;
      case 'commented':
        return `${actorName} added a comment`;
      default:
        return `${actorName} performed action: ${activity.action}`;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-32">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-lg font-semibold text-gray-900">Activity Feed</h2>

      <div className="space-y-4">
        {activities.map(activity => (
          <div key={activity.id} className="flex space-x-3">
            <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
              <Activity className="w-4 h-4 text-white" />
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="text-sm text-gray-900">
                {formatAction(activity)}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(activity.created_at).toLocaleDateString()} at {new Date(activity.created_at).toLocaleTimeString()}
              </div>
              
              {activity.metadata && Object.keys(activity.metadata).length > 0 && (
                <div className="mt-2 text-xs text-gray-600 bg-gray-50 rounded p-2">
                  {JSON.stringify(activity.metadata, null, 2)}
                </div>
              )}
            </div>
          </div>
        ))}

        {activities.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            <Activity className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No activity yet.</p>
          </div>
        )}
      </div>
    </div>
  );
}