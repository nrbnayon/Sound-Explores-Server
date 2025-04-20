const getOtp = (digits: 4 | 5 | 6): number => {
  const min = Math.pow(10, digits - 1);
  const max = Math.pow(10, digits) - 1;
  const otp = Math.floor(Math.random() * (max - min + 1)) + min;
  return otp;
};

export default getOtp;
