import { Topbar } from '@/components/layout/topbar';
import { UsersTable } from '@/components/users/users-table';

export default function UsersPage() {
  return (
    <>
      <Topbar title="Users" />
      <main className="flex-1 overflow-auto p-5">
        <UsersTable />
      </main>
    </>
  );
}
