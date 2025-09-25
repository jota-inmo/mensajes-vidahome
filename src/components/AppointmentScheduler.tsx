
import React from 'react';
import { Card } from './ui/Card';
import { Input } from './ui/Input';

interface AppointmentSchedulerProps {
  date: string;
  time: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  stepNumber: number;
}

const AppointmentScheduler: React.FC<AppointmentSchedulerProps> = ({
  date,
  time,
  onDateChange,
  onTimeChange,
  stepNumber,
}) => {
  return (
    <Card>
      <h2 className="text-xl font-semibold text-white mb-4">Paso {stepNumber}: Completa los Datos de la Cita</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="appointment-date" className="block text-sm font-medium text-slate-400 mb-1">
            Día de la Cita
          </label>
          <Input
            id="appointment-date"
            type="date"
            value={date}
            onChange={(e) => onDateChange(e.target.value)}
            className="appearance-none"
            required
          />
        </div>
        <div>
          <label htmlFor="appointment-time" className="block text-sm font-medium text-slate-400 mb-1">
            Hora de la Cita
          </label>
          <Input
            id="appointment-time"
            type="time"
            value={time}
            onChange={(e) => onTimeChange(e.target.value)}
            className="appearance-none"
            required
          />
        </div>
      </div>
    </Card>
  );
};

export default AppointmentScheduler;