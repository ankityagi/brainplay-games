interface StarsProps {
  count: 0 | 1 | 2 | 3;
  size?: 'sm' | 'lg';
}

export default function Stars({ count, size = 'sm' }: StarsProps) {
  const cls = size === 'lg' ? 'text-3xl' : 'text-base';
  return (
    <span className={`${cls} tracking-tighter`} aria-label={`${count} out of 3 stars`}>
      {[1, 2, 3].map((i) => (
        <span key={i} className={i <= count ? 'text-amber-400' : 'text-slate-700'}>
          ★
        </span>
      ))}
    </span>
  );
}
