import { NextResponse } from 'next/server';
import { readDb, writeDb, DB } from '@/lib/db';

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as keyof DB | null;

        const db = await readDb();

        if (type) {
            if (db[type]) {
                return NextResponse.json({ data: db[type] });
            }
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        return NextResponse.json({ data: db });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const type = searchParams.get('type') as keyof DB | null;
        const body = await request.json();

        if (!type || !['projects', 'nodes', 'aiMetadata', 'comments'].includes(type)) {
            return NextResponse.json({ error: 'Invalid type' }, { status: 400 });
        }

        const db = await readDb();

        const newItem = {
            ...body,
            id: body.id || (typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2)),
            created_at: body.created_at || new Date().toISOString(),
        };

        (db[type] as any[]).push(newItem);
        await writeDb(db);

        return NextResponse.json({ data: newItem });
    } catch (error) {
        console.error('API Error:', error);
        return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
