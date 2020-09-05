import { useMutation, useFlash } from '@redwoodjs/web'
import { Link, routes } from '@redwoodjs/router'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import relativeTime from 'dayjs/plugin/relativeTime'
import 'dayjs/locale/vi'

import _ from 'lodash'

dayjs.extend(utc)
dayjs.extend(relativeTime)

const FORM_MODELS = {
  clothesSize: [
    { value: 'S', title: 'S|< 50 kg' },
    { value: 'M', title: 'M|50-60 kg' },
    { value: 'L', title: 'L|60-70 kg' },
    { value: 'XL', title: 'XL|< 80 kg' },
    { value: 'XXL', title: 'XXL|> 80 kg' },
    { value: 'Other', title: 'Khác' },
  ],
  // eslint-disable-next-line prefer-spread
  groups: Array.apply(null, { length: 15 })
    .map(Number.call, Number)
    .map((i) => ({ value: i + 1, title: i + 1 })),
  joinAge: [
    { value: 'gt3', title: 'Trên 3 tháng' },
    { value: 'lt3', title: 'Dưới 3 tháng' },
  ],
  paymentLevel: {
    lt3: [{ value: '1500000', title: 'Bạn mới|1.500.000đ' }],
    gt3: [
      { value: '750000', title: 'Sinh viên, thu nhập dưới 3 triệu|750.000đ' },
      { value: '1100000', title: 'Thu nhập 3-5 triệu|1.100.000đ' },
      { value: '1300000', title: 'Thu nhập trên 5-7 triệu|1.300.000đ' },
      { value: '1500000', title: 'Thu nhập trên 7 triệu|1.500.000đ' },
    ],
  },
  paymentMethod: [
    { value: 'BANK', title: 'Chuyển khoản trực tiếp cho thủ quỹ' },
    { value: 'GROUP_LEADER', title: 'Nộp tiền mặt trực tiếp cho nhóm trưởng' },
    { value: 'MANAGER', title: 'Nộp tiền mặt trực tiếp cho thủ quỹ' },
  ],
  paymentStage: [
    { value: 'FULL', title: 'Đóng đủ một lần' },
    { value: 'PARTIAL', title: 'Đặt cọc|500.000đ' },
  ],
  gender: [
    { value: 'MALE', title: 'Nam' },
    { value: 'FEMALE', title: 'Nữ' },
  ],
}

const mapArrayAsKeys = (params) =>
  _.chain(params).keyBy('key').mapValues('value').value()

const DELETE_DRAFT_PROFILE_MUTATION = gql`
  mutation DeleteDraftProfileMutation($id: String!) {
    deleteDraftProfile(id: $id) {
      id
    }
  }
`

const MAX_STRING_LENGTH = 150

const truncate = (text) => {
  let output = text
  if (text && text.length > MAX_STRING_LENGTH) {
    output = output.substring(0, MAX_STRING_LENGTH) + '...'
  }
  return output
}

const metaTitle = (model, metaValue) => {
  for (const meta of FORM_MODELS[model]) {
    if (meta.value === metaValue) {
      return meta.title
    }
  }
  return metaValue
}

const birthdayTag = (birthday) => {
  return dayjs(birthday).format('DD/MM/YYYY')
}

const timeTag = (datetime) => {
  return dayjs(datetime).locale('vi').fromNow()
}

const currency = (amount) => {
  if (amount > 0) {
    const formatter = new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    })
    return formatter.format(amount)
  }
  return null
}

const DraftProfilesList = ({ draftProfiles }) => {
  const { addMessage } = useFlash()

  // Preprocess meta data
  const table = []
  for (const profile of draftProfiles) {
    const obj = mapArrayAsKeys(profile.meta)
    table.push({ ...profile, ...obj })
  }

  const [deleteDraftProfile] = useMutation(DELETE_DRAFT_PROFILE_MUTATION, {
    onCompleted: () => {
      addMessage('DraftProfile deleted.', { classes: 'rw-flash-success' })
    },
  })

  const onDeleteClick = (id) => {
    if (confirm('Are you sure you want to delete draftProfile ' + id + '?')) {
      deleteDraftProfile({
        variables: { id },
        refetchQueries: ['DRAFT_PROFILES'],
      })
    }
  }

  return (
    <div className="rw-segment rw-table-wrapper-responsive">
      <table className="rw-table">
        <thead>
          <tr>
            <th>CMND</th>
            <th>Họ và tên</th>
            <th>Số điện thoại</th>
            <th>Sinh nhật</th>
            <th>Nhóm Nhỏ</th>
            <th>Size Áo</th>
            <th>Thời gian nhóm lại</th>
            <th>Mức đóng lệ phí</th>
            <th>Dâng thêm</th>
            <th>Hình thức đóng phí</th>
            <th>Thời gian</th>
            <th>&nbsp;</th>
          </tr>
        </thead>
        <tbody>
          {table.map((draftProfile) => (
            <tr key={draftProfile.id}>
              <td>{truncate(draftProfile.nationalId)}</td>
              <td>{truncate(draftProfile.fullName)}</td>
              <td>{truncate(draftProfile.phoneNumber)}</td>
              <td>{birthdayTag(draftProfile.birthday)}</td>
              <td>{truncate(draftProfile.group)}</td>
              <td>{truncate(draftProfile.clothesSize)}</td>
              <td>{metaTitle('joinAge', draftProfile.joinAge)}</td>
              <td>{currency(draftProfile.paymentLevel)}</td>
              <td>{currency(draftProfile.offering)}</td>
              <td>{metaTitle('paymentMethod', draftProfile.paymentMethod)}</td>
              <td>{timeTag(draftProfile.createdAt)}</td>
              <td>
                <nav className="rw-table-actions">
                  <Link
                    to={routes.draftProfile({ id: draftProfile.id })}
                    title={'Show draftProfile ' + draftProfile.id + ' detail'}
                    className="rw-button rw-button-small"
                  >
                    Xem
                  </Link>
                  <Link
                    to={routes.editDraftProfile({ id: draftProfile.id })}
                    title={'Edit draftProfile ' + draftProfile.id}
                    className="rw-button rw-button-small rw-button-blue"
                  >
                    Sửa
                  </Link>
                  {/* <a
                    href="#"
                    title={'Delete draftProfile ' + draftProfile.id}
                    className="rw-button rw-button-small rw-button-red"
                    onClick={() => onDeleteClick(draftProfile.id)}
                  >
                    Xóa
                  </a> */}
                </nav>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default DraftProfilesList
