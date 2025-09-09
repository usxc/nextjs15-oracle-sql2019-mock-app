import { prisma } from "@/lib/db";
import { requireUser } from "@/lib/auth"

export default async function Home() {
    const { userId } = await requireUser();
    const profile = await prisma.userProfile.findUnique( { where: { userId } } );
    const name = profile?.displayName ?? 'User';
    const imageUrl = profile?.imageUrl;

    
    return (
        <div>
            
        </div>
    )
}