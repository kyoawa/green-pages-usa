// app/api/admin/states/[code]/toggle/route.ts
export const runtime = 'nodejs';

import { NextResponse } from 'next/server';
import { SSMClient, GetParameterCommand, PutParameterCommand } from '@aws-sdk/client-ssm';

const REGION = process.env.AWS_REGION || 'us-west-2';

const ssm = new SSMClient({
  region: REGION,
  credentials:
    process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY
      ? {
          accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
          secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
        }
      : undefined,
});

const stateNames: Record<string, string> = {
  CA: 'California',
  MT: 'Montana',
  IL: 'Illinois',
  MO: 'Missouri',
  OK: 'Oklahoma',
  NY: 'New York',
};

function paramName(code: string) {
  return `/green-pages/states/${code}/active`;
}

export async function POST(req: Request, { params }: { params: { code: string } }) {
  const code = (params.code || '').toUpperCase();
  if (!stateNames[code]) {
    return NextResponse.json({ success: false, error: `Unknown state code: ${code}` }, { status: 400 });
  }

  let desired: boolean | undefined;
  try {
    if (req.headers.get('content-type')?.includes('application/json')) {
      const body = await req.json().catch(() => ({}));
      if (typeof body?.active === 'boolean') desired = body.active;
    }
  } catch { /* ignore */ }

  const name = paramName(code);

  try {
    let current = true;
    try {
      const got = await ssm.send(new GetParameterCommand({ Name: name, WithDecryption: true }));
      current = got.Parameter?.Value !== 'false';
    } catch (e: any) {
      if (e?.name !== 'ParameterNotFound') throw e;
    }

    const newValue = typeof desired === 'boolean' ? desired : !current;

    await ssm.send(
      new PutParameterCommand({
        Name: name,
        Type: 'String',
        Value: newValue ? 'true' : 'false',
        Overwrite: true,
      })
    );

    return NextResponse.json({
      success: true,
      state: { code, name: stateNames[code], active: newValue },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err?.message || 'Failed to toggle state' }, { status: 500 });
  }
}
