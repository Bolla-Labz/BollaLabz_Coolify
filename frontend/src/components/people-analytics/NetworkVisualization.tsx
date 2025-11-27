// Last Modified: 2025-11-23 17:30
// Network Visualization Component
// Simplified network graph visualization

import { PersonExtended, InteractionAnalytic } from '../../types/people-analytics';
import { Badge } from '../ui/badge';

interface NetworkVisualizationProps {
  people: PersonExtended[];
  interactions: InteractionAnalytic[];
}

export function NetworkVisualization({ people, interactions }: NetworkVisualizationProps) {
  // Calculate interaction counts between people
  const getConnectionStrength = (personId: string) => {
    return interactions.filter((i) => i.personId === personId).length;
  };

  // Group people by interaction frequency
  const groupedPeople = people.reduce((acc, person) => {
    const strength = getConnectionStrength(person.id);
    let category = 'weak';

    if (strength > 10) category = 'strong';
    else if (strength > 5) category = 'medium';

    if (!acc[category]) acc[category] = [];
    acc[category].push(person);

    return acc;
  }, {} as Record<string, PersonExtended[]>);

  const getNodeColor = (category: string) => {
    const colors = {
      strong: 'bg-green-500',
      medium: 'bg-blue-500',
      weak: 'bg-gray-400',
    };
    return colors[category as keyof typeof colors] || colors.weak;
  };

  const getCategoryLabel = (category: string) => {
    const labels = {
      strong: 'Strong Connections',
      medium: 'Medium Connections',
      weak: 'Weak Connections',
    };
    return labels[category as keyof typeof labels] || category;
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Visualize your relationship network by connection strength
      </p>

      {/* Simplified Network Visualization */}
      <div className="relative bg-secondary/20 rounded-lg p-8 min-h-[400px]">
        {/* Center Node - User */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
          <div className="w-16 h-16 rounded-full bg-primary flex items-center justify-center text-white font-bold shadow-lg">
            YOU
          </div>
        </div>

        {/* Connection Circles */}
        {Object.entries(groupedPeople).map(([category, persons], categoryIndex) => {
          const radius = 120 + categoryIndex * 60;
          const angleStep = (2 * Math.PI) / Math.max(persons.length, 1);

          return persons.map((person, index) => {
            const angle = index * angleStep;
            const x = radius * Math.cos(angle);
            const y = radius * Math.sin(angle);

            return (
              <div
                key={person.id}
                className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
                style={{
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                {/* Connection Line */}
                <svg
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none"
                  style={{
                    width: Math.abs(x) + 50,
                    height: Math.abs(y) + 50,
                  }}
                >
                  <line
                    x1="50%"
                    y1="50%"
                    x2={x < 0 ? '100%' : '0%'}
                    y2={y < 0 ? '100%' : '0%'}
                    stroke="currentColor"
                    strokeWidth="1"
                    className="stroke-muted opacity-30"
                  />
                </svg>

                {/* Node */}
                <div
                  className={`relative w-12 h-12 rounded-full ${getNodeColor(
                    category
                  )} flex items-center justify-center text-white text-xs font-bold shadow-md hover:scale-110 transition-transform cursor-pointer group`}
                  title={person.fullName}
                >
                  {person.fullName
                    .split(' ')
                    .map((n) => n[0])
                    .join('')
                    .toUpperCase()
                    .slice(0, 2)}

                  {/* Tooltip */}
                  <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-background border rounded-lg shadow-lg z-10">
                    <p className="text-sm font-medium text-foreground">
                      {person.fullName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {getConnectionStrength(person.id)} interactions
                    </p>
                  </div>
                </div>
              </div>
            );
          });
        })}
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 justify-center">
        {Object.entries(groupedPeople).map(([category, persons]) => (
          <Badge key={category} variant="secondary" className="gap-2">
            <div className={`w-3 h-3 rounded-full ${getNodeColor(category)}`} />
            {getCategoryLabel(category)} ({persons.length})
          </Badge>
        ))}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
        <div className="text-center">
          <p className="text-2xl font-bold">{people.length}</p>
          <p className="text-xs text-muted-foreground">Total Contacts</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{groupedPeople.strong?.length || 0}</p>
          <p className="text-xs text-muted-foreground">Strong Connections</p>
        </div>
        <div className="text-center">
          <p className="text-2xl font-bold">{interactions.length}</p>
          <p className="text-xs text-muted-foreground">Total Interactions</p>
        </div>
      </div>
    </div>
  );
}
