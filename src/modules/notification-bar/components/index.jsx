import React from 'react'
import Styles from 'modules/notification-bar/components/notification-bar'
import { CloseWithCircle } from 'src/modules/common/components/icons'
import PropTypes from 'prop-types'

export const NotificationBar = ({ actionFn, dismissFn, notifications }) => notifications.map(notification => (
  <div key={notification.orderId} className={Styles.notificationBar}>
    <div className={Styles.notificationBar_textContainer}>
      <p className={Styles.notificationBar_text}>
        {notification.orderId}
      </p>
    </div>
    <button className={Styles.notificationBar_button} onClick={() => actionFn(notification)}>
      SIGN TRANSACTION
    </button>
    <button className={Styles.notificationBar_dismiss} onClick={() => dismissFn(notification)}>
      Dismiss
      <div className={Styles.notificationBar_dismissIcon}>
        <CloseWithCircle />
      </div>
    </button>
  </div>))

NotificationBar.propTypes = {
  cancelOrder: PropTypes.func,
  notifications: PropTypes.arrayOf(PropTypes.object),
}
