import { useDispatch } from 'react-redux';
import { addCardByLink } from '../../store/slices/appSlice';

export default function SpellLink({ link, children }) {
  const dispatch = useDispatch();
  const handleClick = e => {
    e.preventDefault();
    dispatch(addCardByLink({ links: link }));
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      style={{
        background: 'none',
        border: 'none',
        padding: 0,
        margin: 0,
        color: '#222222',
        cursor: 'pointer',
        textDecoration: 'underline',
        font: 'inherit'   // preserve font styling
      }}
    >
      {children}
    </button>
  );
}
