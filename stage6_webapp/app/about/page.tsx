import { teamMembers } from "../../config/team";
import { Users } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="space-y-8 animate-fade-in max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-lg bg-[#22E3D0]/20 flex items-center justify-center">
          <Users className="text-[#22E3D0]" />
        </div>
        <h1 className="text-3xl font-bold text-white">About the Team</h1>
      </div>

      <div className="glass-card p-8">
        <h2 className="text-xl font-bold text-white mb-6">CTRL+CELL</h2>
        <div className="space-y-6">
          {teamMembers.map((member, i) => (
            <div key={i} className="flex flex-col border-b border-white/10 pb-4 last:border-0 last:pb-0">
              <span className="text-lg font-bold text-white mb-1">{member.name}</span>
              <span className="text-[#8A93AD] text-sm mb-2">{member.role}</span>
              {member.github && (
                <a href={member.github} target="_blank" rel="noreferrer" className="text-sm text-[#5B8CFF] hover:text-[#22E3D0] transition-colors w-max">
                  GitHub Profile
                </a>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
