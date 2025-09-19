import { Metadata } from 'next';
import { DeletedItemsDashboard } from '@/components/deleted-items/deleted-items-dashboard';

export const metadata: Metadata = {
  title: 'Deleted Items',
  description: 'Manage and recover deleted items from the last 6 months',
};

export default function DeletedItemsPage() {
  return <DeletedItemsDashboard />;
}