// app/api/states/active/route.ts
export const runtime = 'nodejs'; // critical: avoid Edge runtime

import { NextResponse } from 'next/server';
import { SSMClient, GetParametersCommand, GetParametersByPathCommand } from '@aws-sdk/client-ssm';

const REGION = process.env.AWS_REGION || 'us-west-2';

// Option A: keep your explicit list (matches your current approach)
const ALL_STATES = ['CA', 'MT', 'IL', 'MO', 'OK', 'NY'];

const ssm = new SSMClient({
  region: REGION,
  credentials: process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
    ? {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
      }
    : undefined, // let default provider chain handle it if unset
});

export async function GET() {
  try {
    // --- Option A: using GetParameters with explicit names ---
    const Names = ALL_STATES.map(s => `/green-pages/states/${s}/active`);
    const { Parameters = [] } = await ssm.send(
      new GetParametersCommand({
        Names,
        WithDecryption: true,
      })
    );

    const activeStates = ALL_STATES.filter(s => {
      const p = Parameters.find(p => p.Name === `/green-pages/states/${s}/active`);
      // default to true when missing or not "false"
      return p?.Value !== 'false';
    });

    return NextResponse.json(activeStates, { status: 200 });

    // --- Option B (alternative): dynamic by path ---
    // const out = await ssm.send(new GetParametersByPathCommand({
    //   Path: '/green-pages/states/',
    //   WithDecryption: true,
    //   Recursive: true,
    // }));
    // const map = new Map(out.Parameters?.map(p => [p.Name!, p.Value]) ?? []);
    // const active = [];
    // for (const [name, value] of map) {
    //   if (name.endsWith('/active') && value !== 'false') {
    //     active.push(name.split('/')[3]); // /green-pages/states/{STATE}/active
    //   }
    // }
    // return NextResponse.json(active, { status: 200 });
  } catch (err: any) {
    console.error('Error fetching active states:', err);
    // Safe fallback: treat all as active on error
    return NextResponse.json(ALL_STATES, { status: 200 });
  }
}
