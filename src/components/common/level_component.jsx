import '../../style/menu_cards.css';

const LevelComponent = ({ props }) => {

  const handleLevelIncrement = () => {
    const level = parseFloat(props.level);
    props.onLevelChange(level + 1);
  };

  const handleLevelDecrement = () => {
    const level = parseFloat(props.level);
    props.onLevelChange(level - 1);
  };

  return (
    <>
      <div className='card-side-div margin-top'>
        <label className='modern-label'>{props.levelName}:</label>
        <div className='levels-div'>

          <button className='levels-button small' onClick={handleLevelDecrement}>
            <span className='material-symbols-outlined'>
              remove
            </span>
          </button>

          <div className='level-frame'>
            <label className='level-text'>{parseInt(props.level)}</label>
          </div>

          <button className='levels-button small' onClick={handleLevelIncrement}>
            <span className='material-symbols-outlined'>
              add
            </span>
          </button>

        </div>
      </div>
    </>
  );
}

export default LevelComponent;
