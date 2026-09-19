'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useAccount, useConfig } from 'wagmi'
import { readContract } from 'wagmi/actions'
import { useQueryClient } from '@tanstack/react-query'
import { isaFactoryAbi } from '@/lib/abis'
import { CONTRACTS_CONFIGURED, FACTORY_ADDRESS } from '@/lib/contracts'
import { formatToken, parseToken } from '@/lib/format'
import { useTx } from '@/components/TransactionProvider'
import { WalletButton } from '@/components/WalletButton'
import {
  Button,
  Callout,
  Card,
  CardHeader,
  Field,
  Input,
  Select,
  Textarea,
  TermRow,
} from '@/components/ui'

const CATEGORIES = ['Education', 'Certification', 'Career transition', 'Creative', 'Independent work']

const PRESET = {
  displayName: '',
  headline: 'AI career transition',
  description:
    'Twelve-week applied machine learning program plus three months of living runway while I move into an ML engineering role.',
  category: 'Education',
  fundingGoal: '5000',
  incomeShare: '7',
  termMonths: '36',
  repaymentCap: '12000',
  minIncome: '2000',
}

type FormState = typeof PRESET

export default function CreatePage() {
  const { address, isConnected } = useAccount()
  const { run, busy } = useTx()
  const config = useConfig()
  const router = useRouter()
  const queryClient = useQueryClient()

  const [form, setForm] = useState<FormState>(PRESET)
  const [stage, setStage] = useState<'edit' | 'review'>('edit')

  const set = <K extends keyof FormState>(key: K, value: FormState[K]) =>
    setForm((f) => ({ ...f, [key]: value }))

  const parsed = useMemo(() => {
    const safe = (v: string) => {
      try {
        return parseToken(v)
      } catch {
        return 0n
      }
    }
    return {
      fundingGoal: safe(form.fundingGoal),
      repaymentCap: safe(form.repaymentCap),
      minIncome: safe(form.minIncome),
      incomeShareBps: Math.round(Number(form.incomeShare || '0') * 100),
      termMonths: Number(form.termMonths || '0'),
    }
  }, [form])

  const errors = useMemo(() => {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!form.displayName.trim()) e.displayName = 'Required.'
    if (!form.headline.trim()) e.headline = 'Required.'
    if (form.description.trim().length < 40) e.description = 'Give funders at least a couple of sentences.'
    if (parsed.fundingGoal <= 0n) e.fundingGoal = 'Must be greater than zero.'
    if (!Number.isFinite(parsed.incomeShareBps) || parsed.incomeShareBps <= 0 || parsed.incomeShareBps > 5000)
      e.incomeShare = 'Between 0.01% and 50%.'
    if (!Number.isInteger(parsed.termMonths) || parsed.termMonths < 1 || parsed.termMonths > 120)
      e.termMonths = 'Between 1 and 120 months.'
    if (parsed.repaymentCap < parsed.fundingGoal)
      e.repaymentCap = 'The cap cannot be below the funding goal.'
    return e
  }, [form, parsed])

  const valid = Object.keys(errors).length === 0

  // What a representative month looks like under these terms.
  const exampleIncome = parsed.minIncome > 0n ? parsed.minIncome * 2n : parseToken('4000')
  const examplePayment = (exampleIncome * BigInt(parsed.incomeShareBps || 0)) / 10000n

  if (!CONTRACTS_CONFIGURED) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 sm:px-6">
        <Callout tone="caution" title="Contracts not configured">
          Set <code className="font-mono">NEXT_PUBLIC_FACTORY_ADDRESS</code> in{' '}
          <code className="font-mono">web/.env.local</code> before creating an agreement.
        </Callout>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6">
      <h1 className="text-2xl font-semibold tracking-tight text-ink">Create an agreement</h1>
      <p className="mt-2 text-sm text-ink-soft">
        Publishing deploys your own agreement contract on Monad Testnet. The terms below become the
        rules the contract enforces — they cannot be edited afterwards.
      </p>

      {stage === 'edit' ? (
        <div className="mt-8 space-y-8">
          <Card>
            <CardHeader title="About you" />
            <div className="space-y-5 p-5">
              <Field label="Display name" htmlFor="name" error={errors.displayName}>
                <Input
                  id="name"
                  value={form.displayName}
                  placeholder="e.g. Sarah Mehta"
                  onChange={(e) => set('displayName', e.target.value)}
                />
              </Field>
              <Field label="What you are raising for" htmlFor="headline" error={errors.headline}>
                <Input
                  id="headline"
                  value={form.headline}
                  onChange={(e) => set('headline', e.target.value)}
                />
              </Field>
              <Field label="Category" htmlFor="category">
                <Select
                  id="category"
                  value={form.category}
                  onChange={(e) => set('category', e.target.value)}
                >
                  {CATEGORIES.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field
                label="Details"
                htmlFor="description"
                error={errors.description}
                hint="What the money covers and what changes afterwards. Stored on-chain."
              >
                <Textarea
                  id="description"
                  rows={5}
                  value={form.description}
                  onChange={(e) => set('description', e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <Card>
            <CardHeader title="Terms" description="Enforced by your agreement contract." />
            <div className="grid gap-5 p-5 sm:grid-cols-2">
              <Field label="Funding goal" htmlFor="goal" suffix="tUSD" error={errors.fundingGoal}>
                <Input
                  id="goal"
                  inputMode="decimal"
                  className="pr-14"
                  value={form.fundingGoal}
                  onChange={(e) => set('fundingGoal', e.target.value)}
                />
              </Field>
              <Field label="Income share" htmlFor="share" suffix="%" error={errors.incomeShare}>
                <Input
                  id="share"
                  inputMode="decimal"
                  className="pr-10"
                  value={form.incomeShare}
                  onChange={(e) => set('incomeShare', e.target.value)}
                />
              </Field>
              <Field label="Term" htmlFor="term" suffix="months" error={errors.termMonths}>
                <Input
                  id="term"
                  inputMode="numeric"
                  className="pr-20"
                  value={form.termMonths}
                  onChange={(e) => set('termMonths', e.target.value)}
                />
              </Field>
              <Field
                label="Repayment cap"
                htmlFor="cap"
                suffix="tUSD"
                error={errors.repaymentCap}
                hint="The most you can ever owe in total."
              >
                <Input
                  id="cap"
                  inputMode="decimal"
                  className="pr-14"
                  value={form.repaymentCap}
                  onChange={(e) => set('repaymentCap', e.target.value)}
                />
              </Field>
              <Field
                label="Minimum monthly income"
                htmlFor="floor"
                suffix="tUSD"
                hint="Below this, nothing is owed for that period."
              >
                <Input
                  id="floor"
                  inputMode="decimal"
                  className="pr-14"
                  value={form.minIncome}
                  onChange={(e) => set('minIncome', e.target.value)}
                />
              </Field>
            </div>
          </Card>

          <div className="flex justify-end">
            <Button size="lg" disabled={!valid} onClick={() => setStage('review')}>
              Review terms
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-8 space-y-6">
          <Card>
            <CardHeader title="Review" description="This is exactly what the contract will store." />
            <dl className="px-5 py-2">
              <TermRow label="Name" value={form.displayName} />
              <TermRow label="Purpose" value={form.headline} />
              <TermRow label="Category" value={form.category} />
              <TermRow label="Funding goal" value={`${formatToken(parsed.fundingGoal)} tUSD`} />
              <TermRow label="Income share" value={`${form.incomeShare}%`} />
              <TermRow label="Term" value={`${parsed.termMonths} months`} />
              <TermRow label="Repayment cap" value={`${formatToken(parsed.repaymentCap)} tUSD`} />
              <TermRow
                label="Minimum monthly income"
                value={`${formatToken(parsed.minIncome)} tUSD`}
              />
            </dl>
          </Card>

          <Callout tone="accent" title="What this means month to month">
            Report {formatToken(exampleIncome)} tUSD of income and you owe{' '}
            {formatToken(examplePayment)} tUSD for that period. Report nothing above the{' '}
            {formatToken(parsed.minIncome)} tUSD floor and you owe nothing. Once{' '}
            {formatToken(parsed.repaymentCap)} tUSD has been settled in total, the agreement closes
            and nothing further is owed.
          </Callout>

          {!isConnected ? (
            <Card>
              <CardHeader title="Connect a wallet" description="Needed to deploy on Monad Testnet." />
              <div className="p-5">
                <WalletButton />
              </div>
            </Card>
          ) : null}

          <div className="flex flex-wrap justify-between gap-3">
            <Button variant="secondary" onClick={() => setStage('edit')}>
              Back to editing
            </Button>
            <Button
              size="lg"
              disabled={busy || !isConnected || !valid}
              onClick={async () => {
                const before = (await readContract(config, {
                  address: FACTORY_ADDRESS,
                  abi: isaFactoryAbi,
                  functionName: 'getAgreementCount',
                })) as bigint

                const ok = await run({
                  title: 'Publishing your agreement',
                  summary: 'Deploying an agreement contract on Monad Testnet',
                  steps: [
                    {
                      label: 'Call createAgreement()',
                      request: {
                        address: FACTORY_ADDRESS,
                        abi: isaFactoryAbi,
                        functionName: 'createAgreement',
                        args: [
                          parsed.fundingGoal,
                          parsed.repaymentCap,
                          parsed.minIncome,
                          parsed.incomeShareBps,
                          parsed.termMonths,
                          form.displayName.trim(),
                          form.headline.trim(),
                          form.description.trim(),
                          form.category,
                        ],
                      },
                    },
                  ],
                })

                if (!ok) return
                queryClient.invalidateQueries()

                // The factory indexes by creation order, so the new agreement is at `before`.
                try {
                  const created = (await readContract(config, {
                    address: FACTORY_ADDRESS,
                    abi: isaFactoryAbi,
                    functionName: 'getAgreement',
                    args: [before],
                  })) as string
                  router.push(`/agreement/${created}`)
                } catch {
                  router.push('/recipient')
                }
              }}
            >
              {busy ? 'Publishing…' : 'Publish agreement'}
            </Button>
          </div>

          <p className="text-xs leading-relaxed text-ink-muted">
            Recipient address: {address ?? 'not connected'}. Income reported against this agreement
            is a self-attested testnet figure, clearly labelled as such throughout the product.
          </p>
        </div>
      )}
    </div>
  )
}
