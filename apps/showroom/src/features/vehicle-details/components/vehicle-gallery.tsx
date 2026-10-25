import Image from 'next/image';
import type { VehicleImage } from '@car-dealer/contracts';

export function VehicleGallery({ images, title }: { images: VehicleImage[]; title: string }) {
  if (images.length === 0) {
    return (
      <div role="img" aria-label={`No photos yet for ${title}`} className="flex aspect-[16/10] items-center justify-center bg-mist text-sm uppercase tracking-widest text-slate">
        Photos coming soon
      </div>
    );
  }
  const [hero, ...rest] = images;
  return (
    <div className="space-y-2">
      <div className="relative aspect-[16/10] bg-mist">
        <Image src={hero!.url} alt={hero!.altText ?? title} fill priority sizes="(min-width: 1024px) 60vw, 100vw" className="object-cover" />
      </div>
      {rest.length > 0 ? (
        <ul className="grid grid-cols-4 gap-2">
          {rest.slice(0, 4).map((img) => (
            <li key={img.id} className="relative aspect-[16/10] bg-mist">
              <Image src={img.url} alt={img.altText ?? title} fill sizes="15vw" className="object-cover" />
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
