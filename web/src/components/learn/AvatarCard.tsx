interface AvatarCardProps {
  word: string;
  image: string | null;
}

export default function AvatarCard({ word, image }: AvatarCardProps) {
  return (
    <div className="w-80 h-80 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center flex-shrink-0 overflow-hidden">
      {image ? (
        <img
          src={image}
          alt={word}
          className="w-full h-full object-cover"
        />
      ) : (
        <span
          className="font-bold select-none text-center leading-tight px-4"
          style={{ fontSize: 72, color: "rgba(255,255,255,0.06)" }}
        >
          {word}
        </span>
      )}
    </div>
  );
}
