export default function SwipeLoading({ selectedChar }) {
  return (
    <div className="swipe-page swipe-page--dark" style={{ '--char-color': selectedChar.themeColor }}>
      <div className="swipe-loading">
        <div className="swipe-loading__avatar-wrap">
          {selectedChar.image
            ? <img src={selectedChar.image} alt={selectedChar.name} className="swipe-loading__avatar" loading="lazy" decoding="async" />
            : <span className="swipe-loading__emoji">{selectedChar.emoji}</span>}
          <span className="swipe-loading__pulse" />
        </div>
        <p className="swipe-loading__name">{selectedChar.name}</p>
        <p className="swipe-loading__text">preparando las afirmaciones...</p>
        <div className="swipe-loading__dots"><span /><span /><span /></div>
      </div>
    </div>
  )
}
