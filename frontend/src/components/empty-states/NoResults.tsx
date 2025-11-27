// Last Modified: 2025-11-24 00:00
import { SearchX } from 'lucide-react';
import { EmptyState } from '@/components/ui/empty-state';

interface NoResultsProps {
  searchQuery: string;
  onClearSearch: () => void;
}

export function NoResults({ searchQuery, onClearSearch }: NoResultsProps) {
  return (
    <EmptyState
      icon={SearchX}
      title="No results found"
      description={`No items match "${searchQuery}". Try adjusting your search terms or filters.`}
      action={{
        label: 'Clear Search',
        onClick: onClearSearch,
        variant: 'outline',
      }}
    />
  );
}
