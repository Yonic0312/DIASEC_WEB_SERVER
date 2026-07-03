package com.diasec.diasec_backend.service;

import java.util.List;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;
import com.diasec.diasec_backend.dao.BizConsultMapper;
import com.diasec.diasec_backend.util.ImageUtil;
import com.diasec.diasec_backend.vo.BizConsultFileVo;
import com.diasec.diasec_backend.vo.BizConsultVo;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class BizConsultService {
    private final BizConsultMapper bizConsultMapper;
    private final BCryptPasswordEncoder passwordEncoder;
    private final ImageUtil imageUtil;

    public void registerConsult(BizConsultVo vo) {
        vo.setPassword(passwordEncoder.encode(vo.getPassword()));
        bizConsultMapper.registerConsult(vo);
    }

    public void insertConsultFile(Long consultId, String filePath, String originalName) {
        bizConsultMapper.insertConsultFile(consultId, filePath, originalName);
    }

    public List<BizConsultVo> getConsultList() {
        return bizConsultMapper.getConsultList();
    }

    public BizConsultVo getConsultDetail(Long id) {
        BizConsultVo vo = bizConsultMapper.getConsultDetail(id);
        if (vo != null) {
            vo.setFileList(bizConsultMapper.getConsultFiles(id));
        }
        return vo;
    }

    public BizConsultVo getPostById(int id) {
        return bizConsultMapper.getPostById(id);
    }

    public int countConsult() {
        return bizConsultMapper.countConsult();
    }

    public void deleteConsult(Long id) {
        List<BizConsultFileVo> files = bizConsultMapper.getConsultFiles(id);
        if (files != null) {
            for (BizConsultFileVo file : files) {
                if (file.getFilePath() != null) {
                    imageUtil.deleteImage(file.getFilePath());
                }
            }
        }
        bizConsultMapper.deleteConsultFiles(id);
        bizConsultMapper.deleteConsult(id);
    }

    public void completeConsult(Long id) {
        bizConsultMapper.updateConsultStatus(id, "완료");
    }

    public void reopenConsult(Long id) {
        bizConsultMapper.updateConsultStatus(id, "미완료");
    }

    public boolean deleteConsultFile(Long oid) {
        BizConsultFileVo file = bizConsultMapper.getConsultFileByOid(oid);
        if (file == null) {
            return false;
        }
        if (file.getFilePath() != null) {
            imageUtil.deleteImage(file.getFilePath());
        }
        bizConsultMapper.deleteConsultFileByOid(oid);
        return true;
    }
}