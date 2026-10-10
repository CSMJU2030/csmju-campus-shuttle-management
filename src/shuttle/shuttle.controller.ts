import { Controller, Get } from '@nestjs/common';

@Controller('shuttle')
export class ShuttleController {
  @Get('schedule')
  getSchedule() {
    return {
      status: 'success',
      message: 'ดึงข้อมูลตารางเดินรถสำเร็จ',
      data: [
        { id: 1, route: 'สาย A: หอพัก 9 มล. -> อาคารเรียนรวม', time: '08:30 น.', status: 'กำลังให้บริการ' },
        { id: 2, route: 'สาย B: หอพักชาย -> โรงอาหารกลาง', time: '08:45 น.', status: 'จอดรอที่จุดจอด' }
      ]
    };
  }
}