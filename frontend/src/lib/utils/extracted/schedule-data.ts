// Last Modified: 2025-11-23 17:30
/**
 * Mock Schedule Data
 * Sample data for development and testing
 */

import { Task, TaskStatus, TaskPriority } from '@/types/task';
import { CalendarEvent,  EventStatus } from '@/types/event';
import { Note, NoteColor } from '@/types/note';
import { addDays, setHours, setMinutes } from 'date-fns';

// Helper to create dates
const today = new Date();
const todayAt = (hour: number, minute: number = 0) => {
  return setMinutes(setHours(today, hour), minute);
};

// Mock Tasks
export const mockTasks: Task[] = [
  {
    id: '1',
    title: 'Read poem & answer questions',
    description: 'Complete the poetry analysis assignment from English Literature class',
    status: 'in_progress',
    priority: 'high',
    category: 'English Literature',
    dueDate: new Date('2025-04-28'),
    createdAt: new Date('2025-04-20'),
    updatedAt: new Date('2025-04-25'),
    commentsCount: 12,
    progress: 45,
    estimatedMinutes: 90
  },
  {
    id: '2',
    title: 'Create a comic strip with a story',
    description: 'Draw a 6-panel comic strip for Social Studies project',
    status: 'todo',
    priority: 'medium',
    category: 'Social Studies',
    dueDate: new Date('2025-05-17'),
    createdAt: new Date('2025-04-15'),
    updatedAt: new Date('2025-04-15'),
    commentsCount: 0,
    progress: 0,
    estimatedMinutes: 120
  },
  {
    id: '3',
    title: 'Prepare for the math test',
    description: 'Review chapters 5-7 and practice problems',
    status: 'todo',
    priority: 'urgent',
    category: 'Math',
    dueDate: new Date('2025-05-11'),
    createdAt: new Date('2025-05-01'),
    updatedAt: new Date('2025-05-01'),
    commentsCount: 2,
    progress: 0,
    estimatedMinutes: 180
  },
  {
    id: '4',
    title: 'Read the chapter about plant and animal',
    description: 'Biology chapter 8 reading assignment',
    status: 'todo',
    priority: 'high',
    category: 'Biology',
    dueDate: new Date('2025-04-22'),
    createdAt: new Date('2025-04-18'),
    updatedAt: new Date('2025-04-18'),
    commentsCount: 3,
    progress: 0,
    estimatedMinutes: 60
  },
  {
    id: '5',
    title: 'Review Vapi voice AI integration',
    description: 'Test conversation flows and memory management',
    status: 'in_progress',
    priority: 'high',
    category: 'Development',
    dueDate: addDays(today, 2),
    createdAt: addDays(today, -5),
    updatedAt: today,
    assigneeId: 'user-1',
    assigneeName: 'John Doe',
    commentsCount: 5,
    progress: 60,
    estimatedMinutes: 240
  },
  {
    id: '7',
    title: 'Update documentation for Agent 3',
    description: 'Document all schedule and task management components',
    status: 'in_progress',
    priority: 'medium',
    category: 'Documentation',
    dueDate: addDays(today, 3),
    createdAt: addDays(today, -1),
    updatedAt: today,
    assigneeId: 'user-1',
    assigneeName: 'John Doe',
    commentsCount: 2,
    progress: 75,
    estimatedMinutes: 120
  },
  {
    id: '8',
    title: 'Code review for frontend components',
    description: 'Review DataTable, charts, and dashboard components',
    status: 'done',
    priority: 'medium',
    category: 'Development',
    dueDate: addDays(today, -1),
    createdAt: addDays(today, -7),
    updatedAt: addDays(today, -1),
    assigneeId: 'user-2',
    assigneeName: 'Jane Smith',
    commentsCount: 15,
    progress: 100,
    estimatedMinutes: 90,
    actualMinutes: 105
  }
];

// Mock Calendar Events
export const mockEvents: CalendarEvent[] = [
  {
    id: 'e1',
    title: 'Wake up Buddy',
    description: 'Morning alarm and routine',
    type: 'reminder',
    status: 'scheduled',
    startTime: todayAt(7, 0),
    endTime: todayAt(7, 15),
    durationMinutes: 15,
    color: '#FCD34D',
    icon: '⏰',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e2',
    title: 'Morning Yoga',
    description: '30-minute yoga session',
    type: 'workout',
    status: 'scheduled',
    startTime: todayAt(8, 0),
    endTime: todayAt(8, 30),
    durationMinutes: 30,
    color: '#FCD34D',
    icon: '🧘',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e3',
    title: 'Daily workout',
    description: 'Morning exercise routine',
    type: 'workout',
    status: 'scheduled',
    startTime: todayAt(9, 0),
    endTime: todayAt(9, 45),
    durationMinutes: 45,
    notes: '• Squat 10x3\n• Push-up 10x3\n• Push-up 10x3',
    color: '#FCD34D',
    icon: '💪',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e4',
    title: 'Shift project kick off pt.1',
    description: 'Zoom call kick off with Elaine and Jordan from Shift',
    type: 'meeting',
    status: 'scheduled',
    startTime: todayAt(10, 0),
    endTime: todayAt(11, 30),
    durationMinutes: 90,
    location: 'Zoom',
    participants: [
      { id: 'p1', name: 'Elaine', role: 'required', status: 'accepted' },
      { id: 'p2', name: 'Jordan', role: 'required', status: 'accepted' }
    ],
    color: '#FBBF24',
    icon: '👥',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e5',
    title: 'Skype Sushi',
    description: 'Lunch with Ally, fight the quarantine with humor!',
    type: 'meal',
    status: 'scheduled',
    startTime: todayAt(12, 30),
    endTime: todayAt(13, 30),
    durationMinutes: 60,
    location: 'Skype',
    participants: [
      { id: 'p3', name: 'Ally', role: 'required', status: 'accepted' }
    ],
    color: '#FBBF24',
    icon: '🍱',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e6',
    title: 'Dribbble Shot',
    description: 'Working on a new shot',
    type: 'task',
    status: 'scheduled',
    startTime: todayAt(14, 0),
    endTime: todayAt(15, 0),
    durationMinutes: 60,
    notes: 'Working on a new shot !!',
    color: '#FBBF24',
    icon: '🎨',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e7',
    title: 'Math',
    description: 'Math class with Mrs. Goodman',
    type: 'meeting',
    status: 'scheduled',
    startTime: todayAt(8, 30),
    endTime: todayAt(9, 30),
    durationMinutes: 60,
    location: 'B3, Room 124',
    participants: [
      { id: 't1', name: 'Mrs. Goodman', role: 'organizer', status: 'accepted' }
    ],
    color: '#3B82F6',
    icon: '📐',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e8',
    title: 'ELA',
    description: 'English Language Arts with Ms. Melton',
    type: 'meeting',
    status: 'scheduled',
    startTime: todayAt(10, 30),
    endTime: todayAt(11, 30),
    durationMinutes: 60,
    location: 'B2, Room 158',
    participants: [
      { id: 't2', name: 'Ms. Melton', role: 'organizer', status: 'accepted' }
    ],
    color: '#8B5CF6',
    icon: '📚',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e9',
    title: 'Biology',
    description: 'Biology class with Mr. Hodge',
    type: 'meeting',
    status: 'scheduled',
    startTime: todayAt(12, 0),
    endTime: todayAt(13, 0),
    durationMinutes: 60,
    location: 'B3, Room 310',
    participants: [
      { id: 't3', name: 'Mr. Hodge', role: 'organizer', status: 'accepted' }
    ],
    color: '#10B981',
    icon: '🔬',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'e10',
    title: 'Social Studies',
    description: 'Social Studies with Mrs. Murray',
    type: 'meeting',
    status: 'scheduled',
    startTime: todayAt(14, 0),
    endTime: todayAt(15, 0),
    durationMinutes: 60,
    location: 'B1, Room 112',
    participants: [
      { id: 't4', name: 'Mrs. Murray', role: 'organizer', status: 'accepted' }
    ],
    color: '#F59E0B',
    icon: '🌍',
    createdAt: today,
    updatedAt: today
  }
];

// Weekly Pinned Items
export const mockWeeklyPinned: CalendarEvent[] = [
  {
    id: 'w1',
    title: 'Call doctor for tests',
    description: 'Ask for blood tests and GYM certificate',
    type: 'call',
    status: 'scheduled',
    startTime: new Date('2020-03-15T09:00:00'),
    endTime: new Date('2020-03-15T09:30:00'),
    durationMinutes: 30,
    recurring: true,
    recurringPattern: 'weekly',
    color: '#3B82F6',
    icon: '📞',
    createdAt: today,
    updatedAt: today
  },
  {
    id: 'w2',
    title: "Beatrice's bday",
    description: "Don't forget Beatrice's birthday!",
    type: 'reminder',
    status: 'scheduled',
    startTime: new Date('2020-03-22'),
    endTime: new Date('2020-03-22'),
    durationMinutes: 0,
    allDay: true,
    color: '#EC4899',
    icon: '🎂',
    createdAt: today,
    updatedAt: today
  }
];

// Mock Notes
export const mockNotes: Note[] = [
  {
    id: 'n1',
    title: 'Math conspect',
    content: 'A linear equation is an equation of the form: ax+b=cax + b = c where xxx is the variable, aaa, bbb, and ccc are constants, and a≠0a \\neq 0a̸=0.',
    color: 'green',
    isPinned: true,
    tags: ['math', 'study'],
    createdAt: new Date('2025-05-05'),
    updatedAt: new Date('2025-05-05'),
    userId: 'user-1'
  },
  {
    id: 'n2',
    title: 'Biology conspect',
    content: 'A cell is the basic structural, functional, and biological unit of all living organisms. It is the smallest unit capable of performing life functions.',
    color: 'purple',
    isPinned: true,
    tags: ['biology', 'study'],
    createdAt: new Date('2025-10-24'),
    updatedAt: new Date('2025-10-24'),
    userId: 'user-1'
  },
  {
    id: 'n3',
    title: 'Project Ideas',
    content: '1. Voice AI personal assistant\n2. Automated workflow system\n3. Context-aware messaging\n4. Relationship management dashboard',
    color: 'blue',
    isPinned: false,
    tags: ['ideas', 'projects'],
    createdAt: addDays(today, -5),
    updatedAt: addDays(today, -2),
    userId: 'user-1'
  },
  {
    id: 'n4',
    title: 'Meeting Notes - Shift Kickoff',
    content: '## Key Points\n- Project timeline: 3 months\n- Weekly check-ins every Thursday\n- Deliverables: MVP by end of Q2\n\n## Action Items\n- [ ] Set up project repository\n- [ ] Schedule team onboarding\n- [ ] Create design mockups',
    color: 'pink',
    isPinned: false,
    tags: ['meetings', 'shift'],
    createdAt: addDays(today, -1),
    updatedAt: today,
    userId: 'user-1'
  }
];

// Helper function to get today's events
export function getTodayEvents(): CalendarEvent[] {
  return mockEvents.filter(event => {
    const eventDate = new Date(event.startTime);
    return (
      eventDate.getDate() === today.getDate() &&
      eventDate.getMonth() === today.getMonth() &&
      eventDate.getFullYear() === today.getFullYear()
    );
  });
}

// Helper function to get upcoming events (next 7 days)
export function getUpcomingEvents(): CalendarEvent[] {
  const sevenDaysFromNow = addDays(today, 7);
  return mockEvents.filter(event => {
    return event.startTime > today && event.startTime <= sevenDaysFromNow;
  });
}

// Helper function to get tasks by status
export function getTasksByStatus(status: TaskStatus): Task[] {
  return mockTasks.filter(task => task.status === status);
}
