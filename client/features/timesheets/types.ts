export type TimeLogStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'INVOICED';

export interface BackendTimeLog {
  id: string;
  userId: string;
  clockIn: string;
  clockOut?: string | null;
  totalHours?: number | null;
  overtimeHours?: number | null;
  status: TimeLogStatus;
  notes?: string | null;
  createdAt?: string;
}

export interface TimesheetEntry {
  id: string;
  employeeId: string;
  date: string;
  startTime: string;
  endTime: string;
  hoursWorked: number;
  overtime: number;
  status: 'pending' | 'approved' | 'rejected';
  notes?: string;
}

export interface CreateTimeLogPayload {
  userId: string;
  clockIn: string;
  clockOut?: string;
  notes?: string;
  totalHours?: number;
}

export interface UpdateTimeLogPayload extends Partial<CreateTimeLogPayload> {}

export function mapBackendTimelogToUi(entry: BackendTimeLog): TimesheetEntry {
  const startDate = new Date(entry.clockIn);
  const endDate = entry.clockOut ? new Date(entry.clockOut) : startDate;

  return {
    id: entry.id,
    employeeId: entry.userId,
    date: startDate.toISOString().slice(0, 10),
    startTime: startDate.toISOString().slice(11, 16),
    endTime: endDate.toISOString().slice(11, 16),
    hoursWorked: entry.totalHours ?? 0,
    overtime: entry.overtimeHours ?? 0,
    status:
      entry.status === 'APPROVED' || entry.status === 'INVOICED'
        ? 'approved'
        : entry.status === 'REJECTED'
          ? 'rejected'
          : 'pending',
    notes: entry.notes ?? undefined,
  };
}
