import { vehicleImage } from '../../lib/dummyData'

// Renders a vehicle model photo with a fallback to default.png if the named
// file doesn't exist.
export default function VehicleImage({ model, className = 'w-full h-24 object-contain', alt }) {
  const src = vehicleImage(model)
  return (
    <img
      src={src}
      alt={alt || model || 'vehicle'}
      className={className}
      onError={(e) => { e.currentTarget.src = '/assets/cars_img/default.png' }}
    />
  )
}
