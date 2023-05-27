import { FC, useEffect, useMemo, useState } from 'react';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import useUserSOLBalanceStore from '../../stores/useUserSOLBalanceStore';
import { ErrorResponse, GetResponse, PostRequest, PostResponse, PutRequest } from 'pages/api/signing';
import { notify } from 'utils/notifications';
import Pusher from 'pusher-js';
import { v4 as uuid } from 'uuid'

export const HomeView: FC = ({ }) => {
  const wallet = useWallet();
  const { connection } = useConnection();

  const balance = useUserSOLBalanceStore((s) => s.balance)
  const { getUserSOLBalance } = useUserSOLBalanceStore()

  useEffect(() => {
    if (wallet.publicKey) {
      console.log(wallet.publicKey.toBase58())
      getUserSOLBalance(wallet.publicKey, connection)
    }
  }, [wallet.publicKey, connection, getUserSOLBalance])

  const channelId = useMemo(() => uuid(), [])

  const signingApiUrl = `/api/signing?channelId=${channelId}`

  useEffect(() => {
    Pusher.logToConsole = true;

    const pusher = new Pusher(process.env.NEXT_PUBLIC_PUSHER_APP_KEY, {
      cluster: process.env.NEXT_PUBLIC_PUSHER_CLUSTER
    });

    const channel = pusher.subscribe(channelId);
    channel.bind('account-connected', function ({ message }) {
      setServerMessage(message)
      notify({ type: 'success', message })
    });
  }, [channelId]);

  // get request
  const [label, setLabel] = useState('')
  const [icon, setIcon] = useState('')

  // post request
  const [data, setData] = useState('')
  const [state, setState] = useState('')
  const [message, setMessage] = useState('')

  // signature
  const [signature, setSignature] = useState('')

  // server message
  const [serverMessage, setServerMessage] = useState<string | undefined>(undefined)

  // Make requests
  async function getRequest() {
    const res = await fetch(signingApiUrl, { method: 'GET' })
    const json = await res.json() as GetResponse
    setLabel(json.label)
  }

  async function postRequest() {
    const input: PostRequest = {
      account: wallet.publicKey.toBase58()
    }
    const res = await fetch(
      signingApiUrl,
      {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      }
    )
    const json = await res.json() as PostResponse
    setData(json.data)
    setState(json.state)
    setMessage(json.message)
  }

  async function signData() {
    const dataUint8Array = Buffer.from(data, 'base64') // new TextEncoder().encode(data)
    const sig = await wallet.signMessage(dataUint8Array)
    const sigBase64 = Buffer.from(sig).toString('base64')
    setSignature(sigBase64)
  }

  async function putRequest() {
    const input: PutRequest = {
      account: wallet.publicKey.toBase58(),
      data,
      state,
      signature
    }
    const res = await fetch(
      signingApiUrl,
      {
        method: 'PUT',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      }
    )
    if (res.status >= 400) {
      const json = await res.json() as ErrorResponse
      notify({ type: 'error', message: json.message })
    }
  }

  async function allinone() {
    const res1 = await fetch(signingApiUrl, { method: 'GET' })
    const json1 = await res1.json() as GetResponse
    setLabel(json1.label)
    
    const input: PostRequest = {
      account: wallet.publicKey.toBase58()
    }
    const res = await fetch(
      signingApiUrl,
      {
        method: 'POST',
        body: JSON.stringify(input),
        headers: { 'Content-Type': 'application/json' },
      }
    )
    const json = await res.json() as PostResponse
    setData(json.data)
    setState(json.state)
    setMessage(json.message)
  }

  return (
    <div className="md:hero mx-auto p-4">
      <div className="flex flex-col max-w-6xl items-start p-4 mx-auto">
        <div className='mt-6 self-center'>
          <h1 className="text-center text-5xl md:pl-12 font-bold text-transparent bg-clip-text bg-gradient-to-br from-indigo-500 to-fuchsia-500 mb-4">
            Message Signing Test
          </h1>
        </div>

        <hr className='divider' />

        <section className='flex flex-col gap-4 items-start'>
          <h4 className="md:w-full text-3xl text-slate-300 my-2">
            Server Messages
          </h4>
          <p>Channel ID: {channelId}</p>
          <p>{serverMessage ?? "Waiting for server message..."}</p>
        </section>

        <hr className='divider' />

        <section className='flex flex-col gap-4 items-start'>
          <h4 className="md:w-full text-3xl text-slate-300 my-2">
            <p>Step 1: GET Request</p>
          </h4>
          <button className='btn max-w-fit' onClick={allinone}>Request</button>
          <p className='left-0'>Label: {label}</p>
          <p>Message: {message}</p>
        </section>

        <hr className='divider' />

        <section className='flex flex-col gap-4 items-start'>
          <h4 className="md:w-full text-3xl text-slate-300 my-2">
            <p>Step 2: Sign in to your wallet</p>
          </h4>
          <button className='btn max-w-fit' onClick={signData} disabled={!wallet.connected || !data}>Sign in</button>
          {!wallet.connected && <p className='text-sm'>Requires connected wallet + data</p>}
          <p>Signature: {signature}</p>
        </section>

        <hr className='divider' />

        <section className='flex flex-col gap-4 items-start'>
          <h4 className="md:w-full text-3xl text-slate-300 my-2">
            <p>Step 3: log in to server</p>
          </h4>
          <button className='btn max-w-fit' onClick={putRequest} disabled={!signature}>Log in</button>
          {!signature && <p className='text-sm'>Requires signature</p>}
        </section>
      </div>
    </div>
  );
};
