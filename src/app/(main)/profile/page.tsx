
'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { useMainLayout } from '../layout';

// This page's sole purpose is to redirect to the user's own profile page.
export default function ProfileRedirectPage() {
    const router = useRouter();
    const { currentUser } = useMainLayout();

    useEffect(() => {
        if (currentUser.id) {
            router.replace(`/profile/${currentUser.id}`);
        }
    }, [router, currentUser]);

    return (
        <div className="flex h-full items-center justify-center">
            <p>Redirecting to your profile...</p>
        </div>
    );
}
