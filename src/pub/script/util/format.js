


// 记录当前时间，用于时间格式化过程参考
export function formatDate(stamp) {
  if (!stamp) {return ;}
  if (typeof stamp === 'number' && stamp < 9999999999) {
    stamp = stamp * 1000;
  }
  if (stamp < 1292690711052) {
    return '';
  }
  
  stamp = new Date(stamp);

  const now = new Date();
  const today = {year: now.getFullYear(), month: now.getMonth() + 1, date: now.getDate()};

  const year = stamp.getFullYear();
  const month = stamp.getMonth() + 1;
  const date = stamp.getDate();
  const hour = stamp.getHours();
  const minute = stamp.getMinutes();
  const second = stamp.getSeconds();

  const list0 = [];
  if (year < today.year) {
    list0.push(year.toString());
    list0.push(month.toString().padStart(2, '0'));
    list0.push(date.toString().padStart(2, '0'));
  } else if (month < today.month || date < today.date - 2) {
    list0.push(month.toString().padStart(2, '0'));
    list0.push(date.toString().padStart(2, '0'));
  } else if (date === today.date - 1) {
    list0.push('昨天')
  } else if (date === today.date - 2) {
    list0.push('前天')
  }

  const list1 = [
    hour.toString().padStart(2, '0'),
    minute.toString().padStart(2, '0'),
    second.toString().padStart(2, '0'),
  ];

  return `${list0.length ? (list0.join('-') + ' ') : ''}${list1.join(':')}`;
}