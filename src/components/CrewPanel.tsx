import { Users, Wrench, Crosshair, Sailboat, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CrewMember, CrewRole } from '@/types/game';

interface CrewPanelProps {
  crew: CrewMember[];
  onAssignRole: (crewId: string, role: CrewRole) => void;
  onClose: () => void;
}

const ROLE_CONFIG: Record<CrewRole, { label: string; icon: typeof Users; color: string; desc: string }> = {
  idle: { label: 'Idle', icon: Users, color: '#888888', desc: 'Not assigned' },
  cannons: { label: 'Cannons', icon: Crosshair, color: '#ff4444', desc: 'Faster reload' },
  repairs: { label: 'Repairs', icon: Wrench, color: '#44ff44', desc: 'Heal hull' },
  sails: { label: 'Sails', icon: Sailboat, color: '#4444ff', desc: 'Better speed' },
};

export default function CrewPanel({ crew, onAssignRole, onClose }: CrewPanelProps) {
  const roleCounts = {
    idle: crew.filter(c => c.role === 'idle').length,
    cannons: crew.filter(c => c.role === 'cannons').length,
    repairs: crew.filter(c => c.role === 'repairs').length,
    sails: crew.filter(c => c.role === 'sails').length,
  };

  return (
    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#1A3C5A]/95 border border-[#D4A843]/30 rounded-xl p-6 max-w-lg w-full max-h-[80vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Users className="w-6 h-6 text-[#D4A843]" />
            <h2 className="text-2xl font-bold text-[#D4A843]" style={{ fontFamily: "'Rye', serif" }}>
              Crew Management
            </h2>
          </div>
          <Button
            onClick={onClose}
            variant="ghost"
            className="text-[#A3B8CC] hover:text-white hover:bg-[#0F1F2E]"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {/* Role Summary */}
        <div className="grid grid-cols-4 gap-2 mb-6">
          {(Object.keys(ROLE_CONFIG) as CrewRole[]).map(role => {
            const config = ROLE_CONFIG[role];
            const Icon = config.icon;
            return (
              <div
                key={role}
                className="bg-[#0F1F2E]/80 rounded-lg p-3 text-center border border-[#D4A843]/10"
              >
                <Icon className="w-5 h-5 mx-auto mb-1" style={{ color: config.color }} />
                <div className="text-lg font-bold text-white">{roleCounts[role]}</div>
                <div className="text-xs text-[#A3B8CC]">{config.label}</div>
              </div>
            );
          })}
        </div>

        {/* Crew List */}
        <div className="space-y-2">
          {crew.map((member, idx) => (
            <div
              key={member.id}
              className="bg-[#0F1F2E]/60 rounded-lg p-3 border border-[#D4A843]/10"
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: ROLE_CONFIG[member.role].color + '30', color: ROLE_CONFIG[member.role].color }}
                  >
                    {idx + 1}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{member.name}</div>
                    <div className="text-xs text-[#A3B8CC]">
                      Skill: {(member.skill * 100).toFixed(0)}%
                    </div>
                  </div>
                </div>
                <div
                  className="px-2 py-1 rounded text-xs font-medium"
                  style={{ backgroundColor: ROLE_CONFIG[member.role].color + '20', color: ROLE_CONFIG[member.role].color }}
                >
                  {ROLE_CONFIG[member.role].label}
                </div>
              </div>

              {/* Role assignment buttons */}
              <div className="flex gap-1">
                {(Object.keys(ROLE_CONFIG) as CrewRole[]).map(role => {
                  const config = ROLE_CONFIG[role];
                  const Icon = config.icon;
                  const isActive = member.role === role;
                  return (
                    <Button
                      key={role}
                      onClick={() => onAssignRole(member.id, role)}
                      variant="ghost"
                      className={`flex-1 h-8 text-xs transition-all ${
                        isActive
                          ? 'bg-[#D4A843]/20 text-[#D4A843] border border-[#D4A843]/30'
                          : 'text-[#A3B8CC] hover:text-white hover:bg-[#1A3C5A]'
                      }`}
                    >
                      <Icon className="w-3 h-3 mr-1" />
                      {config.label}
                    </Button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div className="mt-4 p-3 bg-[#0F1F2E]/60 rounded-lg border border-[#D4A843]/10">
          <div className="text-xs text-[#A3B8CC] space-y-1">
            <p><Crosshair className="w-3 h-3 inline mr-1 text-[#ff4444]" /> <strong>Cannons:</strong> Faster reload speed when assigned</p>
            <p><Wrench className="w-3 h-3 inline mr-1 text-[#44ff44]" /> <strong>Repairs:</strong> Slowly regenerates hull HP over time</p>
            <p><Sailboat className="w-3 h-3 inline mr-1 text-[#4444ff]" /> <strong>Sails:</strong> Improves ship speed and maneuverability</p>
          </div>
        </div>
      </div>
    </div>
  );
}
