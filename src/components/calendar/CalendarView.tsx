import React, { useState, useEffect } from 'react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import withDragAndDrop from 'react-big-calendar/lib/addons/dragAndDrop';
import moment from 'moment';
import { db } from '../../lib/database';
import { ChevronLeft, ChevronRight, Filter, Download, Bell } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Item, Task } from '../../types/database';
import ItemModal from '../items/ItemModal';
import clsx from 'clsx';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import 'react-big-calendar/lib/addons/dragAndDrop/styles.css';

const localizer = momentLocalizer(moment);
const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  resource: {
    type: 'item' | 'task';
    id: string;
    itemId: string;
    sectionId: string;
    priority: string;
    status: string;
    completed: boolean;
    section_name: string;
  };
}

export function CalendarView() {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<any>(Views.MONTH);
  const [date, setDate] = useState(new Date());
  const [showCompleted, setShowCompleted] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedSections, setSelectedSections] = useState(['legal', 'deals', 'real-estate', 'others']);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<{ start: Date; end: Date } | null>(null);

  useEffect(() => {
    fetchEvents();
  }, [showCompleted, selectedSections]);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      
      // Fetch items with due dates
      const allItems = await db.getItems();
      const items = allItems.filter(item => 
        item.due_date && selectedSections.includes(item.section_id)
      );

      // Fetch tasks with due dates for items in selected sections
      const allTasks = await db.getTasks();
      const tasks = allTasks.filter(task => {
        if (!task.due_date || task.archived) return false;
        const taskItem = allItems.find(item => item.id === task.item_id);
        return taskItem && selectedSections.includes(taskItem.section_id);
      });

      const calendarEvents: CalendarEvent[] = [];

      const getSectionName = (sectionId: string) => {
        switch (sectionId) {
          case 'legal': return 'Legal Fights';
          case 'deals': return 'Business Deals';
          case 'real-estate': return 'Real Estate';
          case 'others': return 'Others';
          default: return 'Unknown';
        }
      };

      // Add item events
      items.forEach(item => {
        if (item.due_date) {
          const isCompleted = item.status.toLowerCase() === 'completed';
          if (!isCompleted || showCompleted) {
            calendarEvents.push({
              id: `item-${item.id}`,
              title: `${item.title}`,
              start: new Date(item.due_date),
              end: new Date(item.due_date),
              allDay: true,
              resource: {
                type: 'item',
                id: item.id,
                itemId: item.id,
                sectionId: item.section_id,
                priority: item.priority,
                status: item.status,
                completed: isCompleted,
                section_name: getSectionName(item.section_id),
              },
            });
          }
        }
      });

      // Add task events
      tasks.forEach(task => {
        if (task.due_date) {
          const taskItem = allItems.find(item => item.id === task.item_id);
          const isCompleted = task.status.toLowerCase() === 'completed';
          if (!isCompleted || showCompleted) {
            // Build hierarchical title for tasks
            let taskTitle = task.title;
            if (task.task_level > 0 && task.parent) {
              // For level 2 tasks, show grandparent > parent > task
              if (task.task_level === 2 && task.parent.parent) {
                taskTitle = `${task.parent.parent.title} > ${task.parent.title} > ${task.title}`;
              }
              // For level 1 tasks, show parent > task
              else {
                taskTitle = `${task.parent.title} > ${task.title}`;
              }
            }

            // Parse the date/time from the timestamp
            const startDate = new Date(task.due_date);
            const endDate = new Date(startDate);

            // If the time is midnight (00:00), treat as all-day event
            const isAllDay = startDate.getHours() === 0 && startDate.getMinutes() === 0;

            // For timed events, set a default 1-hour duration if not specified
            if (!isAllDay) {
              endDate.setHours(startDate.getHours() + 1);
            }

            calendarEvents.push({
              id: `task-${task.id}`,
              title: `Task: ${taskTitle}`,
              start: startDate,
              end: endDate,
              allDay: isAllDay,
              resource: {
                type: 'task',
                id: task.id,
                itemId: task.item_id,
                sectionId: taskItem?.section_id || '',
                priority: task.priority,
                status: task.status,
                completed: isCompleted,
                section_name: getSectionName(taskItem?.section_id || ''),
              },
            });
          }
        }
      });

      setEvents(calendarEvents);
    } catch (error) {
      console.error('Error fetching calendar events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setLoading(false);
    }
  };

  const eventStyleGetter = (event: CalendarEvent) => {
    const { resource } = event;
    let backgroundColor = '#3174ad';

    // Section-based colors
    switch (resource.sectionId) {
      case 'legal': backgroundColor = '#dc2626'; break;
      case 'deals': backgroundColor = '#16a34a'; break;
      case 'real-estate': backgroundColor = '#2563eb'; break;
      case 'others': backgroundColor = '#9333ea'; break;
    }

    // Priority-based intensity
    let opacity = 1;
    switch (resource.priority) {
      case 'urgent': opacity = 1; break;
      case 'high': opacity = 0.9; break;
      case 'normal': opacity = 0.7; break;
      case 'low': opacity = 0.5; break;
    }

    // Completed items styling
    if (resource.completed) {
      backgroundColor = '#6b7280';
      opacity = 0.6;
    }

    return {
      style: {
        backgroundColor,
        opacity,
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        textDecoration: resource.completed ? 'line-through' : 'none',
        fontSize: '12px',
        padding: '2px 4px',
      },
    };
  };

  const exportToICS = () => {
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Legal Management Platform//Calendar//EN',
      ...events.map(event => [
        'BEGIN:VEVENT',
        `UID:${event.id}@legalplatform.com`,
        `DTSTART;VALUE=DATE:${moment(event.start).format('YYYYMMDD')}`,
        `DTEND;VALUE=DATE:${moment(event.end).add(1, 'day').format('YYYYMMDD')}`,
        `SUMMARY:${event.title}`,
        `DESCRIPTION:${event.resource.section_name} - ${event.resource.type}`,
        'END:VEVENT'
      ]).flat(),
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'legal-platform-calendar.ics';
    a.click();
    URL.revokeObjectURL(url);
    
    toast.success('Calendar exported successfully');
  };

  const handleSelectSlot = (slotInfo: { start: Date; end: Date }) => {
    setSelectedSlot(slotInfo);
    setShowCreateModal(true);
  };

  const handleEventDrop = async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    try {
      const { resource } = event;

      if (resource.type === 'task') {
        // Update the task's due_date in the database
        await db.updateTask(resource.id, {
          due_date: start.toISOString(),
        });

        toast.success('Task rescheduled successfully');
        fetchEvents();
      } else if (resource.type === 'item') {
        // Update the item's due_date in the database
        await db.updateItem(resource.id, {
          due_date: start.toISOString(),
        });

        toast.success('Item rescheduled successfully');
        fetchEvents();
      }
    } catch (error) {
      console.error('Error rescheduling event:', error);
      toast.error('Failed to reschedule event');
    }
  };

  const handleEventResize = async ({ event, start, end }: { event: CalendarEvent; start: Date; end: Date }) => {
    try {
      const { resource } = event;

      if (resource.type === 'task') {
        // Update the task's due_date
        await db.updateTask(resource.id, {
          due_date: start.toISOString(),
        });

        toast.success('Task updated successfully');
        fetchEvents();
      } else if (resource.type === 'item') {
        // Update the item's due_date
        await db.updateItem(resource.id, {
          due_date: start.toISOString(),
        });

        toast.success('Item updated successfully');
        fetchEvents();
      }
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Failed to update event');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Unified Calendar</h1>
          <p className="text-gray-600">All deadlines and important dates across sections</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={showCompleted}
              onChange={(e) => setShowCompleted(e.target.checked)}
              className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
            />
            <span className="ml-2 text-sm text-gray-700">Show completed</span>
          </label>

          <button 
            onClick={() => setShowFilters(!showFilters)}
            className={clsx(
              'flex items-center px-3 py-2 border rounded-lg transition-colors',
              showFilters 
                ? 'border-amber-300 bg-amber-50 text-amber-700' 
                : 'border-gray-300 hover:bg-gray-50'
            )}
            title={showFilters ? "Hide Filters" : "Show Filters"}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </button>

          <button 
            onClick={exportToICS}
            className="flex items-center px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            title="Export calendar to ICS file"
          >
            <Download className="w-4 h-4 mr-2" />
            Export ICS
          </button>
        </div>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-lg p-4 mb-6">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Filter by Section</h3>
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'legal', name: 'Legal Fights', color: '#dc2626' },
              { id: 'deals', name: 'Business Deals', color: '#16a34a' },
              { id: 'real-estate', name: 'Real Estate', color: '#2563eb' },
              { id: 'others', name: 'Others', color: '#9333ea' }
            ].map(section => (
              <label key={section.id} className="flex items-center">
                <input
                  type="checkbox"
                  checked={selectedSections.includes(section.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedSections(prev => [...prev, section.id]);
                    } else {
                      setSelectedSections(prev => prev.filter(s => s !== section.id));
                    }
                  }}
                  className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
                />
                <span className="ml-2 text-sm text-gray-700">{section.name}</span>
                <div 
                  className="w-3 h-3 rounded ml-1"
                  style={{ backgroundColor: section.color }}
                />
              </label>
            ))}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6" style={{ height: '700px' }}>
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          selectable
          onSelectSlot={handleSelectSlot}
          eventPropGetter={eventStyleGetter}
          className="h-full"
          draggableAccessor={() => true}
          resizable
          onEventDrop={handleEventDrop}
          onEventResize={handleEventResize}
          onSelectEvent={(event) => {
            const { resource } = event;
            if (resource.type === 'item') {
              window.open(`/${resource.sectionId}/${resource.itemId}`, '_blank');
            } else {
              window.open(`/${resource.sectionId}/${resource.itemId}`, '_blank');
            }
          }}
          components={{
            toolbar: ({ label, onNavigate, onView }) => (
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => onNavigate('PREV')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => onNavigate('TODAY')}
                    className="px-3 py-2 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors text-sm font-medium"
                  >
                    Today
                  </button>
                  <button
                    onClick={() => onNavigate('NEXT')}
                    className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>

                <h2 className="text-lg font-semibold text-gray-900">{label}</h2>

                <div className="flex items-center space-x-1 bg-gray-100 rounded-lg p-1">
                  {[
                    { key: 'month', label: 'Month' },
                    { key: 'week', label: 'Week' },
                    { key: 'day', label: 'Day' },
                    { key: 'agenda', label: 'Agenda' },
                  ].map(({ key, label }) => (
                    <button
                      key={key}
                      onClick={() => onView(key)}
                      className={clsx(
                        'px-3 py-1 text-sm font-medium rounded-md transition-colors',
                        view === key
                          ? 'bg-white text-gray-900 shadow-sm'
                          : 'text-gray-600 hover:text-gray-900'
                      )}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            ),
          }}
        />
      </div>

      {/* Legend & Stats */}
      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Legend */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">Section Colors</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { name: 'Legal Fights', color: '#dc2626' },
              { name: 'Business Deals', color: '#16a34a' },
              { name: 'Real Estate', color: '#2563eb' },
              { name: 'Others', color: '#9333ea' }
            ].map(section => (
              <div key={section.name} className="flex items-center">
                <div 
                  className="w-4 h-4 rounded mr-2"
                  style={{ backgroundColor: section.color }}
                />
                <span className="text-sm text-gray-700">{section.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
          <h3 className="text-sm font-medium text-gray-900 mb-3">This Month</h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-2xl font-bold text-gray-900">
                {events.filter(e => !e.resource.completed).length}
              </div>
              <div className="text-xs text-gray-600">Active Deadlines</div>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {events.filter(e => e.resource.completed).length}
              </div>
              <div className="text-xs text-gray-600">Completed</div>
            </div>
          </div>
        </div>
      </div>

      {/* Create Event Modal */}
      <ItemModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setSelectedSlot(null);
        }}
        sectionId="legal" // Default section
        sectionName="Legal Fights" // Default section name
        allowSectionSelection={true}
        initialStartDate={selectedSlot?.start ? selectedSlot.start.toISOString().split('T')[0] : undefined}
        initialEndDate={selectedSlot?.end ? selectedSlot.end.toISOString().split('T')[0] : undefined}
        onItemSaved={() => {
          fetchEvents();
          setShowCreateModal(false);
          setSelectedSlot(null);
        }}
      />
    </div>
  );
}