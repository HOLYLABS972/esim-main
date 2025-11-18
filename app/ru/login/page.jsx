import { Suspense } from 'react';
import Login from '../../../src/components/Login';
import Loading from '../../../src/components/Loading';

export default function RussianLoginPage() {
  return (
    <div dir="ltr" lang="ru">
      <Suspense fallback={<Loading />}>
        <Login />
      </Suspense>
    </div>
  );
}


