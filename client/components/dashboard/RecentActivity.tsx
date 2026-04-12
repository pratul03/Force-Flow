"use client";

import * as motion from "motion/react-client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from "date-fns";
import { MOTION_TRANSITIONS } from "@/lib/motion-presets";
import { AnimatedList } from "@/components/ui/animated-list";

export interface ActivityItem {
  id: string;
  type: "leave_request" | "timesheet" | "employee_joined" | "leave_approved";
  title: string;
  description: string;
  timestamp: Date;
  user?: {
    name: string;
    avatar?: string;
  };
  status?: "pending" | "approved" | "rejected";
}

interface RecentActivityProps {
  activities?: ActivityItem[];
}

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
};

const typeEmojis = {
  leave_request: "📋",
  timesheet: "⏰",
  employee_joined: "👤",
  leave_approved: "✅",
};

export function RecentActivity({ activities = [] }: RecentActivityProps) {
  const getInitials = (name?: string) => {
    if (!name) return "U";
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };

  return (
    <motion.div layout transition={MOTION_TRANSITIONS.layout}>
      <Card>
        <CardHeader>
          <CardTitle>Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {activities.length === 0 ? (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No recent activities
              </p>
            ) : (
              <AnimatedList delay={180} className="items-stretch gap-0">
                {activities.map((activity) => (
                  <motion.div
                    key={activity.id}
                    layout
                    transition={MOTION_TRANSITIONS.layout}
                    whileHover={{ x: 2 }}
                    className="flex items-start gap-4 border-b pb-4 last:border-b-0 last:pb-0"
                  >
                    <Avatar className="mt-1 h-9 w-9">
                      <AvatarImage src={activity.user?.avatar} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {getInitials(activity.user?.name)}
                      </AvatarFallback>
                    </Avatar>

                    <div className="min-w-0 flex-1">
                      <div className="mb-1 flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-foreground">
                          {activity.title}
                        </p>
                        {activity.status && (
                          <Badge
                            className={`text-xs ${statusColors[activity.status]}`}
                            variant="outline"
                          >
                            {activity.status}
                          </Badge>
                        )}
                      </div>
                      <p className="mb-2 text-xs text-muted-foreground">
                        {activity.description}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {formatDistanceToNow(activity.timestamp, {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </motion.div>
                ))}
              </AnimatedList>
            )}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
