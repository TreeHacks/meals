import styles from './spacer.module.scss';

function Spacer(props) {
  return <div className={[styles.spacer, props.className].join(' ')} />;
}

export default Spacer;
