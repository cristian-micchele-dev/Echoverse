import { characters } from '../../data/characters'

const BG_IMAGES = [...characters, ...characters]

export default function DashBg({ visible }) {
  return (
    <div className={`dash-bg ${visible ? 'dash-bg--visible' : ''}`} aria-hidden="true">
      <div className="dash-bg-track dash-bg-track--1">
        {BG_IMAGES.map((c, i) => (
          <img key={i} src={c.image} alt="" className="dash-bg-img" draggable={false} />
        ))}
      </div>
      <div className="dash-bg-track dash-bg-track--2">
        {BG_IMAGES.map((c, i) => (
          <img key={i} src={c.image} alt="" className="dash-bg-img" draggable={false} />
        ))}
      </div>
      <div className="dash-bg-overlay" />
    </div>
  )
}
