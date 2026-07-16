import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Clock, Coffee, LogOut, CheckCircle2 } from "lucide-react";
import { attendanceApi } from "@/features/attendance/api";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export function AttendanceWidget() {
  const { user } = useAuth();
  const [status, setStatus] = useState<"logged_out" | "clocked_in" | "on_break" | "clocked_out">("logged_out");
  const [isLoading, setIsLoading] = useState(true);
  const [lastActionTime, setLastActionTime] = useState<Date | null>(null);

  useEffect(() => {
    async function loadStatus() {
      if (!user) return;
      setIsLoading(true);
      try {
        const res = await attendanceApi.getUserAttendance(user.id, new Date().toISOString().slice(0, 10));
        if (res.success && res.data && Array.isArray(res.data) && res.data.length > 0) {
          const latestLog = res.data[0];
          
          if (latestLog.clockOut) {
            setStatus("clocked_out");
          } else {
            // Need to check if there is an active break.
            // Since getUserAttendance returns TimeLog objects, we don't fetch breaks directly here.
            // A more robust implementation would fetch the active break state.
            // For now, assume clocked_in unless we specifically fetch breaks.
            // We'll trust the user to know their state, or we could add an API to get active break.
            setStatus("clocked_in");
          }
          setLastActionTime(new Date(latestLog.clockIn));
        } else {
          setStatus("logged_out");
        }
      } catch (e) {
        console.error("Failed to load attendance", e);
      } finally {
        setIsLoading(false);
      }
    }
    void loadStatus();
  }, [user]);

  const handleClockIn = async () => {
    setIsLoading(true);
    const res = await attendanceApi.clockIn({ clockIn: new Date().toISOString() });
    if (res.success) {
      setStatus("clocked_in");
      setLastActionTime(new Date());
      toast.success("Clocked in successfully!");
    } else {
      toast.error(res.error || "Failed to clock in");
    }
    setIsLoading(false);
  };

  const handleClockOut = async () => {
    setIsLoading(true);
    const res = await attendanceApi.clockOut({ clockOut: new Date().toISOString() });
    if (res.success) {
      setStatus("clocked_out");
      setLastActionTime(new Date());
      toast.success("Clocked out successfully!");
    } else {
      toast.error(res.error || "Failed to clock out");
    }
    setIsLoading(false);
  };

  const handleStartBreak = async () => {
    setIsLoading(true);
    const res = await attendanceApi.startBreak({ reason: "Lunch" });
    if (res.success) {
      setStatus("on_break");
      setLastActionTime(new Date());
      toast.success("Break started");
    } else {
      toast.error(res.error || "Failed to start break");
    }
    setIsLoading(false);
  };

  const handleEndBreak = async () => {
    setIsLoading(true);
    const res = await attendanceApi.endBreak({});
    if (res.success) {
      setStatus("clocked_in");
      setLastActionTime(new Date());
      toast.success("Break ended");
    } else {
      toast.error(res.error || "Failed to end break");
    }
    setIsLoading(false);
  };

  if (!user) return null;

  return (
    <Card className="bg-gradient-to-br from-indigo-50 to-white dark:from-gray-800 dark:to-gray-900 shadow-md">
      <CardHeader className="pb-2 border-b border-indigo-100 dark:border-gray-700">
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="text-indigo-600 dark:text-indigo-400 h-5 w-5" />
          Today's Attendance
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="flex flex-col items-center justify-center space-y-4">
          <div className="text-center">
            <p className="text-sm text-gray-500 font-medium uppercase tracking-wider mb-1">Current Status</p>
            {status === "logged_out" && <div className="text-xl font-bold text-gray-700">Not Clocked In</div>}
            {status === "clocked_in" && <div className="text-xl font-bold text-emerald-600 flex items-center justify-center gap-2"><CheckCircle2 className="h-5 w-5" /> Working</div>}
            {status === "on_break" && <div className="text-xl font-bold text-amber-500 flex items-center justify-center gap-2"><Coffee className="h-5 w-5" /> On Break</div>}
            {status === "clocked_out" && <div className="text-xl font-bold text-gray-500">Shift Ended</div>}
            
            {lastActionTime && (
              <p className="text-xs text-gray-400 mt-1">
                Since {lastActionTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </p>
            )}
          </div>
          
          <div className="flex flex-wrap gap-3 justify-center w-full mt-4">
            {status === "logged_out" && (
              <Button onClick={handleClockIn} disabled={isLoading} className="w-full sm:w-auto shadow-md">
                <Clock className="mr-2 h-4 w-4" /> Clock In
              </Button>
            )}
            
            {status === "clocked_in" && (
              <>
                <Button onClick={handleStartBreak} disabled={isLoading} variant="outline" className="w-full sm:w-auto shadow-sm border-amber-200 text-amber-700 hover:bg-amber-50">
                  <Coffee className="mr-2 h-4 w-4" /> Start Break
                </Button>
                <Button onClick={handleClockOut} disabled={isLoading} variant="destructive" className="w-full sm:w-auto shadow-md">
                  <LogOut className="mr-2 h-4 w-4" /> Clock Out
                </Button>
              </>
            )}

            {status === "on_break" && (
              <Button onClick={handleEndBreak} disabled={isLoading} className="w-full sm:w-auto shadow-md bg-emerald-600 hover:bg-emerald-700">
                <CheckCircle2 className="mr-2 h-4 w-4" /> End Break
              </Button>
            )}

            {status === "clocked_out" && (
              <Button disabled variant="outline" className="w-full sm:w-auto text-gray-400">
                Done for the day
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
