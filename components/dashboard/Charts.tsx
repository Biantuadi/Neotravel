'use client'

import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts'
import type { DayData } from '@/lib/dashboard-data'

// ── Palette ──────────────────────────────────────────────
const C = {
  green:   '#4caf50',
  blue:    '#336bc7',
  orange:  '#f29c12',
  red:     '#e53935',
  purple:  '#7c3aed',
  grey:    '#9ca3af',
  lightBg: '#f5f7fa',
}

const TOOLTIP_STYLE = {
  background: '#1a1a1a',
  border: 'none',
  borderRadius: 10,
  color: '#fff',
  fontSize: 12,
  padding: '8px 12px',
}

// ── Graphique activité 7 jours ────────────────────────────

export function ActivityChart({ data }: { data: DayData[] }) {
  const hasData = data.some(d => d.leads > 0 || d.devis > 0)

  if (!hasData) {
    return (
      <div className="flex items-center justify-center h-[180px] text-[13px] text-[#9ca3af]">
        Pas encore de données cette semaine
      </div>
    )
  }

  return (
    <ResponsiveContainer width="100%" height={180}>
      <AreaChart data={data} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
        <defs>
          <linearGradient id="gradLeads" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.green} stopOpacity={0.25} />
            <stop offset="95%" stopColor={C.green} stopOpacity={0} />
          </linearGradient>
          <linearGradient id="gradDevis" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%"  stopColor={C.blue} stopOpacity={0.2} />
            <stop offset="95%" stopColor={C.blue} stopOpacity={0} />
          </linearGradient>
        </defs>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f6" vertical={false} />
        <XAxis dataKey="jour" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          labelStyle={{ color: '#9ca3af', marginBottom: 4 }}
          cursor={{ stroke: '#e8eaed', strokeWidth: 1 }}
        />
        <Area type="monotone" dataKey="leads" name="Leads"       stroke={C.green} strokeWidth={2} fill="url(#gradLeads)" dot={false} />
        <Area type="monotone" dataKey="devis" name="Devis env." stroke={C.blue}  strokeWidth={2} fill="url(#gradDevis)" dot={false} />
      </AreaChart>
    </ResponsiveContainer>
  )
}

// ── Donut statuts ─────────────────────────────────────────

const PIE_COLORS: Record<string, string> = {
  nouveau_lead: C.grey,
  incomplet:    C.orange,
  qualifie:     C.blue,
  devis_envoye: C.purple,
  relance_1:    C.orange,
  relance_2:    '#ed6a1a',
  accepte:      C.green,
  refuse:       C.red,
  cas_complexe: C.red,
  cloture:      '#d1d5db',
}

const STATUT_LABELS: Record<string, string> = {
  nouveau_lead: 'Nouveau', incomplet: 'Incomplet', qualifie: 'Qualifié',
  devis_envoye: 'Devis envoyé', relance_1: 'Relance 1', relance_2: 'Relance 2',
  accepte: 'Accepté', refuse: 'Refusé', cas_complexe: 'Cas complexe', cloture: 'Clôturé',
}

export function StatutsDonut({ statutCounts }: { statutCounts: Record<string, number> }) {
  const pieData = Object.entries(statutCounts)
    .filter(([, v]) => v > 0)
    .map(([k, v]) => ({ name: STATUT_LABELS[k] ?? k, value: v, key: k }))

  const total = pieData.reduce((s, d) => s + d.value, 0)

  if (total === 0) {
    return (
      <div className="flex items-center justify-center h-[200px] text-[13px] text-[#9ca3af]">
        Aucun dossier
      </div>
    )
  }

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        <PieChart width={140} height={140}>
          <Pie
            data={pieData}
            cx={65} cy={65}
            innerRadius={42} outerRadius={62}
            dataKey="value"
            paddingAngle={2}
            strokeWidth={0}
          >
            {pieData.map((entry) => (
              <Cell key={entry.key} fill={PIE_COLORS[entry.key] ?? C.grey} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={TOOLTIP_STYLE}
            formatter={(v) => [`${v} dossier${Number(v) > 1 ? 's' : ''}`, '']}
          />
        </PieChart>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-[22px] font-extrabold text-[#12151a]">{total}</span>
          <span className="text-[9px] text-[#9ca3af] uppercase tracking-wide">total</span>
        </div>
      </div>
      <div className="flex-1 grid grid-cols-1 gap-1 min-w-0">
        {pieData.slice(0, 6).map(d => (
          <div key={d.key} className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[d.key] ?? C.grey }} />
              <span className="text-[11px] text-[#4b5563] truncate">{d.name}</span>
            </div>
            <span className="text-[11px] font-bold text-[#12151a] shrink-0">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Bar chart pipeline ────────────────────────────────────

interface PipelineData {
  devisEnvoyes: number
  devisAcceptes: number
  devisRefuses: number
  devisEnCours: number
}

export function PipelineBar({ data }: { data: PipelineData }) {
  const chartData = [
    { name: 'Envoyés',  value: data.devisEnvoyes,  fill: C.blue   },
    { name: 'En cours', value: data.devisEnCours,   fill: C.orange },
    { name: 'Acceptés', value: data.devisAcceptes,  fill: C.green  },
    { name: 'Refusés',  value: data.devisRefuses,   fill: C.red    },
  ]

  const max = Math.max(...chartData.map(d => d.value), 1)

  return (
    <ResponsiveContainer width="100%" height={160}>
      <BarChart data={chartData} margin={{ top: 4, right: 4, left: -20, bottom: 0 }} barSize={28}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f6" vertical={false} />
        <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <YAxis allowDecimals={false} domain={[0, max + 1]} tick={{ fontSize: 11, fill: '#9ca3af' }} axisLine={false} tickLine={false} />
        <Tooltip
          contentStyle={TOOLTIP_STYLE}
          cursor={{ fill: 'rgba(0,0,0,0.03)' }}
          formatter={(v) => [`${v}`, '']}
        />
        <Bar dataKey="value" radius={[6, 6, 0, 0]}>
          {chartData.map((entry, idx) => (
            <Cell key={idx} fill={entry.fill} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  )
}

// ── Radial-style gauge (SVG pure) ─────────────────────────

export function GaugeRing({
  pct, color, size = 80, label, sublabel,
}: {
  pct: number; color: string; size?: number; label: string; sublabel?: string
}) {
  const r = (size - 10) / 2
  const circ = 2 * Math.PI * r
  const dash = (pct / 100) * circ

  return (
    <div className="flex flex-col items-center gap-1">
      <svg width={size} height={size}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f3f6" strokeWidth={7} />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" stroke={color} strokeWidth={7}
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x={size / 2} y={size / 2 + 1} textAnchor="middle" dominantBaseline="middle"
          fontSize={13} fontWeight="700" fill="#12151a">
          {pct}%
        </text>
      </svg>
      <span className="text-[11px] font-medium text-[#12151a] text-center leading-tight">{label}</span>
      {sublabel && <span className="text-[10px] text-[#9ca3af] text-center">{sublabel}</span>}
    </div>
  )
}
