/**
 * Copyright (C) 2011 Instructure, Inc.
 *
 * This file is part of Canvas.
 *
 * Canvas is free software: you can redistribute it and/or modify it under
 * the terms of the GNU Affero General Public License as published by the Free
 * Software Foundation, version 3 of the License.
 *
 * Canvas is distributed in the hope that it will be useful, but WITHOUT ANY
 * WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR
 * A PARTICULAR PURPOSE. See the GNU Affero General Public License for more
 * details.
 *
 * You should have received a copy of the GNU Affero General Public License
 * along with this program. If not, see <http://www.gnu.org/licenses/>.
 */

define([
  'jst/speed_grader/submissions_dropdown',
  'jst/speed_grader/speech_recognition',
  'compiled/util/round',
  'underscore',
  'INST' /* INST */,
  'i18n!gradebook',
  'jquery' /* $ */,
  'timezone',
  'compiled/userSettings',
  'str/htmlEscape',
  'rubric_assessment',
  'speed_grader_select_menu',
  'jst/_turnitinInfo',
  'jst/_turnitinScore',
  'jqueryui/draggable' /* /\.draggable/ */,
  'jquery.ajaxJSON' /* getJSON, ajaxJSON */,
  'jquery.instructure_forms' /* ajaxJSONFiles */,
  'jquery.doc_previews' /* loadDocPreview */,
  'jquery.instructure_date_and_time' /* datetimeString */,
  'jqueryui/dialog',
  'jquery.instructure_misc_helpers' /* replaceTags */,
  'jquery.instructure_misc_plugins' /* confirmDelete, showIf, hasScrollbar */,
  'jquery.keycodes' /* keycodes */,
  'jquery.loadingImg' /* loadingImg, loadingImage */,
  'jquery.templateData' /* fillTemplateData, getTemplateData */,
  'media_comments' /* mediaComment */,
  'compiled/jquery/mediaCommentThumbnail',
  'vendor/jquery.ba-hashchange' /* hashchange */,
  'vendor/jquery.elastic' /* elastic */,
  'vendor/jquery.getScrollbarWidth' /* getScrollbarWidth */,
  'vendor/jquery.scrollTo' /* /\.scrollTo/ */,
  'vendor/jquery.spin' /* /\.spin/ */,
  'vendor/spin' /* new Spinner */,
  'vendor/ui.selectmenu' /* /\.selectmenu/ */
], function(submissionsDropdownTemplate, speechRecognitionTemplate, round, _, INST, I18n, $, tz, userSettings, htmlEscape, rubricAssessment, SpeedgraderSelectMenu, turnitinInfoTemplate, turnitinScoreTemplate) {

  // fire off the request to get the jsonData
  window.jsonData = {};
  $.ajaxJSON(window.location.pathname+ '.json' + window.location.search, 'GET', {}, function(json) {
    jsonData = json;
    $(EG.jsonReady);
  });
  // ...and while we wait for that, get this stuff ready

  // PRIVATE VARIABLES AND FUNCTIONS
  // all of the $ variables here are to speed up access to dom nodes,
  // so that the jquery selector does not have to be run every time.
  // note, this assumes that this js file is being loaded at the bottom of the page
  // so that all these dom nodes already exists.
  var $window = $(window),
      $body = $("body"),
      $full_width_container =$("#full_width_container"),
      $left_side = $("#left_side"),
      $resize_overlay = $("#resize_overlay"),
      $right_side = $("#right_side"),
      $width_resizer = $("#width_resizer"),
      $fixed_bottom = $("#fixed_bottom"),
      $gradebook_header = $("#gradebook_header"),
      assignmentUrl = $("#assignment_url").attr('href'),
      $full_height = $(".full_height"),
      $rightside_inner = $("#rightside_inner"),
      $moderation_tabs_div = $("#moderation_tabs"),
      $moderation_tabs = $("#moderation_tabs > ul > li"),
      $moderation_tab_2nd = $moderation_tabs.eq(1),
      $moderation_tab_final = $moderation_tabs.eq(2),
      $new_mark_container = $("#new_mark_container"),
      $new_mark_link = $("#new_mark_link"),
      $new_mark_copy_link1 = $("#new_mark_copy_link1"),
      $new_mark_copy_link2 = $("#new_mark_copy_link2"),
      $new_mark_final_link = $("#new_mark_final_link"),
      $not_gradeable_message = $("#not_gradeable_message"),
      $comments = $("#comments"),
      $comment_blank = $("#comment_blank").removeAttr('id').detach(),
      $comment_attachment_blank = $("#comment_attachment_blank").removeAttr('id').detach(),
      $comment_media_blank = $("#comment_media_blank").removeAttr('id').detach(),
      $add_a_comment = $("#add_a_comment"),
      $add_a_comment_submit_button = $add_a_comment.find("button"),
      $add_a_comment_textarea = $add_a_comment.find("textarea"),
      $group_comment_wrapper = $("#group_comment_wrapper"),
      $comment_attachment_input_blank = $("#comment_attachment_input_blank").detach(),
      fileIndex = 1,
      $add_attachment = $("#add_attachment"),
      minimumWindowHeight = 500,
      $submissions_container = $("#submissions_container"),
      $iframe_holder = $("#iframe_holder"),
      $avatar_image = $("#avatar_image"),
      $x_of_x_students = $("#x_of_x_students_frd"),
      $grded_so_far = $("#x_of_x_graded"),
      $average_score = $("#average_score"),
      $this_student_does_not_have_a_submission = $("#this_student_does_not_have_a_submission").hide(),
      $this_student_has_a_submission = $('#this_student_has_a_submission').hide(),
      $rubric_assessments_select = $("#rubric_assessments_select"),
      $rubric_summary_container = $("#rubric_summary_container"),
      $rubric_holder = $("#rubric_holder"),
      $grade_container = $("#grade_container"),
      $grade = $grade_container.find("input, select"),
      $score = $grade_container.find(".score"),
      $average_score_wrapper = $("#average_score_wrapper"),
      $submission_details = $("#submission_details"),
      $multiple_submissions = $("#multiple_submissions"),
      $submission_late_notice = $("#submission_late_notice"),
      $submission_not_newest_notice = $("#submission_not_newest_notice"),
      $submission_files_container = $("#submission_files_container"),
      $submission_files_list = $("#submission_files_list"),
      $submission_file_hidden = $("#submission_file_hidden").removeAttr('id').detach(),
      $assignment_submission_url = $("#assignment_submission_url"),
      $assignment_submission_turnitin_report_url = $("#assignment_submission_turnitin_report_url"),
      $assignment_submission_resubmit_to_turnitin_url = $("#assignment_submission_resubmit_to_turnitin_url"),
      $rubric_full = $("#rubric_full"),
      $rubric_full_resizer_handle = $("#rubric_full_resizer_handle"),
      $mute_link = $('#mute_link'),
      $no_annotation_warning = $('#no_annotation_warning'),
      $comment_submitted = $('#comment_submitted'),
      $comment_submitted_message = $('#comment_submitted_message'),
      $selectmenu = null,
      browserableCssClasses = /^(image|html|code)$/,
      windowLastHeight = null,
      resizeTimeOut = null,
      iframes = {},
      snapshotCache = {},
      sectionToShow,
      header,
      studentLabel = I18n.t("student", "Student"),
      groupLabel = I18n.t("group", "Group"),
      gradeeLabel = studentLabel,
      utils,
      crocodocSessionTimer;

  utils = {
    getParam: function(name){
      var pathRegex = new RegExp(name + '\/([^\/]+)'),
          searchRegex = new RegExp(name + '=([^&]+)'),
          match;

      match = (window.location.pathname.match(pathRegex) || window.location.search.match(searchRegex));
      if (!match) return false;
      return match[1];
    },
    shouldHideStudentNames: function() {
      // this is for backwards compatability, we used to store the value as
      // strings "true" or "false", but now we store boolean true/false values.
      var settingVal = userSettings.get("eg_hide_student_names");
      return settingVal === true || settingVal === "true" || ENV.force_anonymous_grading;
    }
  };

  function mergeStudentsAndSubmission(){
    jsonData.studentsWithSubmissions = jsonData.context.students;
    jsonData.studentMap = {};
    $.each(jsonData.studentsWithSubmissions, function(i, student){
      this.section_ids = $.map($.grep(jsonData.context.enrollments, function(enrollment, i){
          return enrollment.user_id === student.id;
        }), function(enrollment){
        return enrollment.course_section_id;
      });
      this.submission = $.grep(jsonData.submissions, function(submission, i){
        return submission.user_id === student.id;
      })[0];

      this.submission_state = submissionState(this);
      jsonData.studentMap[student.id] = student;
    });

    // handle showing students only in a certain section.
    // the sectionToShow will be remembered for a given user in a given browser across all assignments in this course
    if (!jsonData.GROUP_GRADING_MODE) {
      sectionToShow = userSettings.contextGet('grading_show_only_section');
      sectionToShow = sectionToShow && String(sectionToShow);
    }
    if (sectionToShow) {
      var tempArray  = $.grep(jsonData.studentsWithSubmissions, function(student, i){
        return $.inArray(sectionToShow, student.section_ids) != -1;
      });
      if (tempArray.length) {
        jsonData.studentsWithSubmissions = tempArray;
      } else {
        alert(I18n.t('alerts.no_students_in_section', "Could not find any students in that section, falling back to showing all sections."));
        userSettings.contextRemove('grading_show_only_section');
        window.location.reload();
      }
    }

    //by defaut the list is sorted alphbetically by student last name so we dont have to do any more work here,
    // if the cookie to sort it by submitted_at is set we need to sort by submitted_at.
    var hideStudentNames = utils.shouldHideStudentNames();
    var compareBy = function(f) {
      return function(a, b) {
        a = f(a);
        b = f(b);
        if ((!a && !b) || a === b) { return 0; }
        if (!a || a > b) { return +1; }
        else { return -1; }
      };
    };
    if(hideStudentNames) {
      jsonData.studentsWithSubmissions.sort(compareBy(function(student) {
        return student &&
          student.submission &&
          student.submission.id;
      }));
    } else if (userSettings.get("eg_sort_by") == "submitted_at") {
      jsonData.studentsWithSubmissions.sort(compareBy(function(student){
        return student &&
          student.submission &&
          +tz.parse(student.submission.submitted_at);
      }));
    } else if (userSettings.get("eg_sort_by") == "submission_status") {
      var states = {
        "not_graded": 1,
        "resubmitted": 2,
        "not_submitted": 3,
        "graded": 4,
        "not_gradeable": 5
      };
      jsonData.studentsWithSubmissions.sort(compareBy(function(student){
        return student &&
          states[submissionState(student)];
      }));
    }
  }

  function submissionState(student) {
    var submission = student.submission;
    if (submission && submission.workflow_state != 'unsubmitted' && (submission.submitted_at || !(typeof submission.grade == 'undefined'))) {
      if ((ENV.grading_role == 'provisional_grader' || ENV.grading_role == 'moderator')
        && !student.needs_provisional_grade && submission.provisional_grade_id === null) {
        // if we are a provisional grader and it doesn't need a grade (and we haven't given one already) then we shouldn't be able to grade it
        return "not_gradeable";
      } else if (!(submission.final_provisional_grade && submission.final_provisional_grade.grade) && !submission.excused &&
        (typeof submission.grade == 'undefined' || submission.grade === null || submission.workflow_state == 'pending_review')) {
        return "not_graded";
      } else if (submission.grade_matches_current_submission) {
        return "graded";
      } else {
        return "resubmitted";
      }
    } else {
      return "not_submitted";
    }
  }

  function formattedsubmissionState(raw, submission) {
    switch(raw) {
      case "graded":
        return I18n.t('graded', "graded");
      case "not_graded":
        return I18n.t('not_graded', "not graded");
      case "not_gradeable":
        return I18n.t('graded', "graded");
      case "not_submitted":
        return I18n.t('not_submitted', 'not submitted');
      case "resubmitted":
        return I18n.t('graded_then_resubmitted', "graded, then resubmitted (%{when})", {'when': $.datetimeString(submission.submitted_at)});
    }
  }

  function classNameBasedOnStudent(student){
    var formatted = formattedsubmissionState(student.submission_state, student.submission);
    return {raw: student.submission_state, formatted: formatted};
  }

  // xsslint safeString.identifier MENU_PARTS_DELIMITER
  var MENU_PARTS_DELIMITER = '----☃----'; // something random and unlikely to be in a person's name

  function initDropdown(){
    var hideStudentNames = utils.shouldHideStudentNames();
    $("#hide_student_names").attr('checked', hideStudentNames);
    var optionsHtml = $.map(jsonData.studentsWithSubmissions, function(s, idx){
      var name = s.name.replace(MENU_PARTS_DELIMITER, ""),
          className = classNameBasedOnStudent(s);

      if(hideStudentNames) {
        name = I18n.t('nth_student', "Student %{n}", {'n': idx + 1});
      }

      return '<option value="' + s.id + '" class="' + htmlEscape(className.raw) + ' ui-selectmenu-hasIcon">' + htmlEscape(name) + MENU_PARTS_DELIMITER + htmlEscape(className.formatted) + MENU_PARTS_DELIMITER + htmlEscape(className.raw) + '</option>';
    }).join("");

    $selectmenu = new SpeedgraderSelectMenu(optionsHtml, MENU_PARTS_DELIMITER);
    $selectmenu.appendTo("#combo_box_container", function(e){
      EG.handleStudentChanged();
    });

    if (jsonData.context.active_course_sections.length && jsonData.context.active_course_sections.length > 1 && !jsonData.GROUP_GRADING_MODE) {
      var $selectmenu_list = $selectmenu.jquerySelectMenu().data('selectmenu').list,
          $menu = $("#section-menu");


      $menu.find('ul').append($.raw($.map(jsonData.context.active_course_sections, function(section, i){
        return '<li><a class="section_' + section.id + '" data-section-id="'+ section.id +'" href="#">'+ htmlEscape(section.name) +'</a></li>';
      }).join('')));

      $menu.insertBefore($selectmenu_list).bind('mouseenter mouseleave', function(event){
        $(this)
          .toggleClass('ui-selectmenu-item-selected ui-selectmenu-item-focus ui-state-hover', event.type == 'mouseenter')
          .find('ul').toggle(event.type == 'mouseenter');
      })
      .find('ul')
        .hide()
        .menu()
        .delegate('a', 'click mousedown', function(){
          userSettings[$(this).data('section-id') == 'all' ? 'contextRemove' : 'contextSet']('grading_show_only_section', $(this).data('section-id'));
          window.location.reload();
        });

      if (sectionToShow) {
        var text = $.map(jsonData.context.active_course_sections, function(section){
                      if (section.id == sectionToShow) { return section.name; }
                   }).join(', ');

        $("#section_currently_showing").text(text);
        $menu.find('ul li a')
          .removeClass('selected')
          .filter('[data-section-id='+ sectionToShow +']')
            .addClass('selected');
      }

	$selectmenu.jquerySelectMenu().selectmenu( 'option', 'open', function(){
        $selectmenu_list.find('li:first').css('margin-top', $selectmenu_list.find('li').height() + 'px');
        $menu.show().css({
          'left'   : $selectmenu_list.css('left'),
          'top'    : $selectmenu_list.css('top'),
          'width'  : $selectmenu_list.width() - ($selectmenu_list.hasScrollbar() && $.getScrollbarWidth()),
          'z-index': Number($selectmenu_list.css('z-index')) + 1
        });

      }).selectmenu( 'option', 'close', function(){
        $menu.hide();
      });
    }
  }

  header = {
    elements: {
      mute: {
        icon: $('#mute_link .ui-icon'),
        label: $('#mute_link .mute_label'),
        link: $('#mute_link'),
        modal: $('#mute_dialog')
      },
      nav: $gradebook_header.find('.prev, .next'),
      spinner: new Spinner({
        length: 2,
        radius: 3,
        trail: 25,
        width: 1
      }),
      settings: {
        form: $('#settings_form'),
        link: $('#settings_link')
      }
    },
    courseId: utils.getParam('courses'),
    assignmentId: utils.getParam('assignment_id'),
    init: function(){
      this.muted = this.elements.mute.link.data('muted');
      this.addEvents();
      this.createModals();
      this.addSpinner();
      return this;
    },
    addEvents: function(){
      this.elements.nav.click($.proxy(this.toAssignment, this));
      this.elements.mute.link.click($.proxy(this.onMuteClick, this));
      this.elements.settings.form.submit(this.submitSettingsForm.bind(this));
      this.elements.settings.link.click(this.showSettingsModal.bind(this));
    },
    addSpinner: function(){
      this.elements.mute.link.append(this.elements.spinner.el);
    },
    createModals: function(){
      this.elements.settings.form.dialog({
        autoOpen: false,
        modal: true,
        resizable: false,
        width: 400
      }).fixDialogButtons();
      // FF hack - when reloading the page, firefox seems to "remember" the disabled state of this
      // button. So here we'll manually re-enable it.
      this.elements.settings.form.find(".submit_button").removeAttr('disabled')
      this.elements.mute.modal.dialog({
        autoOpen: false,
        buttons: [{
          text: I18n.t('cancel_button', 'Cancel'),
          click: $.proxy(function(){
            this.elements.mute.modal.dialog('close');
          }, this)
        },{
          text: I18n.t('mute_assignment', 'Mute Assignment'),
          'class': 'btn-primary',
          click: $.proxy(function(){
            this.toggleMute();
            this.elements.mute.modal.dialog('close');
          }, this)
        }],
        modal: true,
        resizable: false,
        title: this.elements.mute.modal.data('title'),
        width: 400
      });
    },

    toAssignment: function(e){
      e.preventDefault();
      EG[e.target.getAttribute('class')]();
    },

    submitSettingsForm: function(e){
      e.preventDefault();

      userSettings.set('eg_sort_by', $('#eg_sort_by').val());
      if (!ENV.force_anonymous_grading) {
        userSettings.set('eg_hide_student_names', $("#hide_student_names").prop('checked'));
      }

      $(e.target).find(".submit_button").attr('disabled', true).text(I18n.t('buttons.saving_settings', "Saving Settings..."));
      var gradeByQuestion = $("#enable_speedgrader_grade_by_question").prop('checked');
      $.post(ENV.settings_url, {
        enable_speedgrader_grade_by_question: gradeByQuestion
      }).then(function() {
        window.location.reload();
      });
    },

    showSettingsModal: function(e){
      e.preventDefault();
      this.elements.settings.form.dialog('open');
    },

    onMuteClick: function(e){
      e.preventDefault();
      this.muted ? this.toggleMute() : this.elements.mute.modal.dialog('open');
    },

    muteUrl: function(){
      return '/courses/' + this.courseId + '/assignments/' + this.assignmentId + '/mute';
    },

    spinMute: function(){
      this.elements.spinner.spin();
      $(this.elements.spinner.el)
        .css({ left: 9, top: 6})
        .appendTo(this.elements.mute.link);
    },

    toggleMute: function(){
      this.muted = !this.muted;
      var label = this.muted ? I18n.t('unmute_assignment', 'Unmute Assignment') : I18n.t('mute_assignment', 'Mute Assignment'),
          action = this.muted ? 'mute' : 'unmute',
          actions = {
        /* Mute action */
        mute: function(){
          this.elements.mute.icon.css('visibility', 'hidden');
          this.spinMute();
          $.ajaxJSON(this.muteUrl(), 'put', { status: true }, $.proxy(function(res){
            this.elements.spinner.stop();
            this.elements.mute.label.text(label);
            this.elements.mute.icon
              .removeClass('ui-icon-volume-off')
              .addClass('ui-icon-volume-on')
              .css('visibility', 'visible');
          }, this));
        },

        /* Unmute action */
        unmute: function(){
          this.elements.mute.icon.css('visibility', 'hidden');
          this.spinMute();
          $.ajaxJSON(this.muteUrl(), 'put', { status: false }, $.proxy(function(res){
            this.elements.spinner.stop();
            this.elements.mute.label.text(label);
            this.elements.mute.icon
              .removeClass('ui-icon-volume-on')
              .addClass('ui-icon-volume-off')
              .css('visibility', 'visible');
          }, this));
        }
      };

      actions[action].apply(this);
    }
  };

  function initCommentBox(){
    //initialize the auto height resizing on the textarea
    $('#add_a_comment textarea').elastic();

    $(".media_comment_link").click(function(event) {
      event.preventDefault();
      $("#media_media_recording").show().find(".media_recording").mediaComment('create', 'any', function(id, type) {
        $("#media_media_recording").data('comment_id', id).data('comment_type', type);
        EG.handleCommentFormSubmit();
      }, function() {
        EG.revertFromFormSubmit();
      }, true);
    });

    $("#media_recorder_container a").live('click', hideMediaRecorderContainer);

    // handle speech to text for browsers that can (right now only chrome)
    function browserSupportsSpeech(){
      return 'webkitSpeechRecognition' in window;
    }
    if (browserSupportsSpeech()){
      var recognition = new webkitSpeechRecognition();
      var messages = {
        "begin": I18n.t('begin_record_prompt', 'Click the "Record" button to begin.'),
        "allow": I18n.t('allow_message', 'Click the "Allow" button to begin recording.'),
        "recording": I18n.t('recording_message', 'Recording...'),
        "recording_expired": I18n.t('recording_expired_message', 'Speech recognition has expired due to inactivity. Click the "Stop" button to use current text for comment or "Cancel" to discard.'),
        "mic_blocked": I18n.t('mic_blocked_message', 'Permission to use microphone is blocked. To change, go to chrome://settings/contentExceptions#media-stream'),
        "no_speech": I18n.t('nodetect_message', 'No speech was detected. You may need to adjust your microphone settings.')
      }
      configureRecognition(recognition);
      $(".speech_recognition_link").click(function(){
        $(speechRecognitionTemplate({
          message: messages.begin
        }))
          .dialog({
            title: I18n.t('titles.click_to_record', "Speech to Text"),
            minWidth: 450,
            minHeight: 200,
            dialogClass: "no-close",
            buttons: [{
              'class': 'dialog_button',
              text: I18n.t('buttons.dialog_buttons', "Cancel"),
              click: function(){
                recognition.stop();
                $(this).dialog('close').remove();
              }
            },
            {
              id: 'record_button',
              'class': 'dialog_button',
              'aria-label': I18n.t('dialog_button.aria_record', "Click to record"),
              recording: false,
              html: "<div></div>",
              click: function(){
                var $this = $(this)
                processSpeech($this);
              }
            }],
            close: function(){
              recognition.stop();
              $(this).dialog('close').remove();
            }
          })
        return false;
      })
        // show the div that contains the button because it is hidden from browsers that dont support speech
      .closest('div.speech-recognition').show();

      function processSpeech($this){
        if ($('#record_button').attr("recording") == "true"){
          recognition.stop();
          var current_comment = $('#final_results').html() + $('#interim_results').html()
          $add_a_comment_textarea.val(formatComment(current_comment));
          $this.dialog('close').remove();
        }
        else {
          recognition.start();
          $('#dialog_message').text(messages.allow)
        }
      }

      function formatComment(current_comment){
        return current_comment.replace(/<p><\/p>/g, '\n\n').replace(/<br>/g, '\n');
      }

      function configureRecognition(recognition){
        recognition.continuous = true;
        recognition.interimResults = true;
        var final_transcript = '';

        recognition.onstart = function(){
          $('#dialog_message').text(messages.recording);
          $('#record_button').attr("recording", true).attr("aria-label", I18n.t('dialog_button.aria_stop', 'Hit "Stop" to end recording.'))
        }

        recognition.onresult = function(event){
          var interim_transcript = '';
          for (var i = event.resultIndex; i < event.results.length; i++){
            if (event.results[i].isFinal){
              final_transcript += event.results[i][0].transcript;
              $('#final_results').html(linebreak(final_transcript))
            }
            else {
              interim_transcript += event.results[i][0].transcript;
            }
            $('#interim_results').html(linebreak(interim_transcript))
          }
        }

        recognition.onaudiostart = function(event){
          //this call is required for onaudioend event to trigger
        }

        recognition.onaudioend = function(event){
          if ($('#final_results').text() != '' || $('#interim_results').text() != ''){
            $('#dialog_message').text(messages.recording_expired);
          }
        }

        recognition.onend = function(event){
          final_transcript = '';
        }

        recognition.onerror = function(event){
          if (event.error == 'not-allowed') {
            $('#dialog_message').text(messages.mic_blocked);
          }
          else if (event.error = 'no-speech'){
            $('#dialog_message').text(messages.no_speech);
          }
          $('#record_button').attr("recording", false).attr("aria-label", I18n.t('dialog_button.aria_record_reset', "Click to record"));
        }

        // xsslint safeString.function linebreak
        function linebreak(transcript){
          return htmlEscape(transcript).replace(/\n\n/g, '<p></p>').replace(/\n/g, '<br>');
        }
      }
    }
  }

  function hideMediaRecorderContainer(){
    $("#media_media_recording").hide().removeData('comment_id').removeData('comment_type');
  }

  function isAssessmentEditableByMe(assessment){
    //if the assessment is mine or I can :manage_course then it is editable
    if (!assessment || assessment.assessor_id === ENV.RUBRIC_ASSESSMENT.assessor_id ||
         (ENV.RUBRIC_ASSESSMENT.assessment_type == 'grading' && assessment.assessment_type == 'grading')
       ){
          return true;
    }
    return false;
  }

  function getSelectedAssessment(){
    return $.grep(EG.currentStudent.rubric_assessments, function(n,i){
      return n.id == $rubric_assessments_select.val();
    })[0];
  }

  function initRubricStuff(){

    $("#rubric_summary_container .button-container").appendTo("#rubric_assessments_list_and_edit_button_holder").find('.edit').text(I18n.t('edit_view_rubric', "View Rubric"));

    $(".toggle_full_rubric, .hide_rubric_link").click(function(e){
      e.preventDefault();
      EG.toggleFullRubric();
    });

    $rubric_assessments_select.change(function(){
      var selectedAssessment = getSelectedAssessment();
      rubricAssessment.populateRubricSummary($("#rubric_summary_holder .rubric_summary"), selectedAssessment, isAssessmentEditableByMe(selectedAssessment));
    });

    $rubric_full_resizer_handle.draggable({
      axis: 'x',
      cursor: 'crosshair',
      scroll: false,
      containment: '#left_side',
      snap: '#full_width_container',
      appendTo: '#full_width_container',
      start: function(){
        $rubric_full_resizer_handle.draggable( 'option', 'minWidth', $right_side.width() );
      },
      helper: function(){
        return $rubric_full_resizer_handle.clone().addClass('clone');
      },
      drag: function(event, ui) {
        var offset = ui.offset,
            windowWidth = $window.width();
        $rubric_full.width(windowWidth - offset.left);
        $rubric_full_resizer_handle.css("left","0");
      },
      stop: function(event, ui) {
        event.stopImmediatePropagation();
      }
    });

    $(".save_rubric_button").click(function() {
      var $rubric = $(this).parents("#rubric_holder").find(".rubric");
      var data = rubricAssessment.assessmentData($rubric);
      if (ENV.grading_role == 'moderator' || ENV.grading_role == 'provisional_grader') {
        data['provisional'] = '1';
        if (ENV.grading_role == 'moderator' && EG.current_prov_grade_index == 'final') {
          data['final'] = '1';
        }
      }
      var url = $(".update_rubric_assessment_url").attr('href');
      var method = "POST";
      EG.toggleFullRubric();
      $(".rubric_summary").loadingImage();
      $.ajaxJSON(url, method, data, function(response) {
        var found = false;
        if(response && response.rubric_association) {
          rubricAssessment.updateRubricAssociation($rubric, response.rubric_association);
          delete response.rubric_association;
        }
        for (var i in EG.currentStudent.rubric_assessments) {
          if (response.id === EG.currentStudent.rubric_assessments[i].id) {
            $.extend(true, EG.currentStudent.rubric_assessments[i], response);
            found = true;
            continue;
          }
        }
        if (!found) {
          EG.currentStudent.rubric_assessments.push(response);
        }

        // if this student has a submission, update it with the data returned, otherwise we need to create a submission for them
        EG.setOrUpdateSubmission(response.artifact);

        // this next part will take care of group submissions, so that when one member of the group gets assessesed then everyone in the group will get that same assessment.
        $.each(response.related_group_submissions_and_assessments, function(i,submissionAndAssessment){
          //setOrUpdateSubmission returns the student. so we can set student.rubric_assesments
          // submissionAndAssessment comes back with :include_root => true, so we have to get rid of the root
          var student = EG.setOrUpdateSubmission(response.artifact);
          student.rubric_assessments = $.map(submissionAndAssessment.rubric_assessments, function(ra){return ra.rubric_assessment;});
        });

        $(".rubric_summary").loadingImage('remove');
        EG.showGrade();
    	  EG.showDiscussion();
    	  EG.showRubric();
    	  EG.updateStatsInHeader();
      });
    });
  }

  function initKeyCodes(){
    $window.keycodes({keyCodes: "j k p n c r g", ignore: 'input, textarea, embed, object'}, function(event) {
      event.preventDefault();
      event.stopPropagation();

      //Prev()
      if(event.keyString == "j" || event.keyString == "p") {
        EG.prev();
      }
      //next()
      else if(event.keyString == "k" || event.keyString == "n") {
        EG.next();
      }
      //comment
      else if(event.keyString == "f" || event.keyString == "c") {
        $add_a_comment_textarea.focus();
      }
      // focus on grade
      else if(event.keyString == "g") {
        $grade.focus();
      }
      // focus on rubric
      else if(event.keyString == "r") {
        EG.toggleFullRubric();
      }
    });
  }

  function initGroupAssignmentMode() {
    if (jsonData.GROUP_GRADING_MODE) {
      gradeeLabel = groupLabel;
      disableGroupCommentCheckbox();
    }
  }

  function disableGroupCommentCheckbox() {
    $("#submission_group_comment").prop({checked: true, disabled: true});
  }

  $.extend(INST, {
    refreshGrades: function(){
      var url = unescape($assignment_submission_url.attr('href')).replace("{{submission_id}}", EG.currentStudent.submission.user_id) + ".json";
      var currentStudentIDAsOfAjaxCall = EG.currentStudent.id;
      $.getJSON( url,
        function(data){
          if(currentStudentIDAsOfAjaxCall === EG.currentStudent.id) {
            EG.currentStudent.submission = data.submission;
            EG.showGrade();
          }
      });
    },
    refreshQuizSubmissionSnapshot: function(data) {
      snapshotCache[data.user_id + "_" + data.version_number] = data;
      if(data.last_question_touched) {
        INST.lastQuestionTouched = data.last_question_touched;
      }
    },
    clearQuizSubmissionSnapshot: function(data) {
      snapshotCache[data.user_id + "_" + data.version_number] = null;
    },
    getQuizSubmissionSnapshot: function(user_id, version_number) {
      return snapshotCache[user_id + "_" + version_number];
    }
  });

  function beforeLeavingSpeedgrader() {
    window.opener && window.opener.updateGrades && $.isFunction(window.opener.updateGrades) && window.opener.updateGrades();

    var userNamesWithPendingQuizSubmission = $.map(snapshotCache, function(snapshot) {
      return snapshot && $.map(jsonData.context.students, function(student) {
        return (snapshot == student) && student.name;
      })[0];
    })
      hasPendingQuizSubmissions = (function(){
        var ret = false;
        if (userNamesWithPendingQuizSubmission.length){
          for (var i = 0, max = userNamesWithPendingQuizSubmission.length; i < max; i++){
            if (userNamesWithPendingQuizSubmission[i] !== false) { ret = true; }
          }
        }
        return ret;
      })();
    var hasUnsubmittedComments = $.trim($add_a_comment_textarea.val()) !== "";
    if (hasPendingQuizSubmissions) {
      return I18n.t('confirms.unsaved_changes', "The following students have unsaved changes to their quiz submissions: \n\n %{users}\nContinue anyway?", {'users': userNamesWithPendingQuizSubmission.join('\n ')});
    } else if (hasUnsubmittedComments) {
      return I18n.t("If you would like to keep your unsubmitted comments, please save them before navigating away from this page.");
    }
  }

  // Public Variables and Methods
  var EG = {
    options: {},
    publicVariable: [],
    currentStudent: null,

    domReady: function(){
      $moderation_tabs_div.tabs();
      $moderation_tabs.each(function(index) {
        if (index == 2) index = "final"; // this will make it easier to identify the final mark
        if (index == 3) { // don't show for the cog menu
          $(this).find('a').off('click');
        } else {
          $(this).find('a').click(function(e) {
            e.preventDefault();
            EG.showProvisionalGrade(index);
          });
          $('<i class="icon-check selected_icon"></i>').prependTo($(this).find('.mark_title'));
          $('<button class="Button"></button>').text(I18n.t('Select')).appendTo($(this)).click(function(){
            EG.selectProvisionalGrade(index);
          });
        }
      });
      $new_mark_link.click(function(e){ e.preventDefault(); EG.newProvisionalGrade('new', 1)} );
      $new_mark_final_link.click(function(e){ e.preventDefault(); EG.newProvisionalGrade('new', 'final')} );
      $new_mark_copy_link1.click(function(e){ e.preventDefault(); EG.newProvisionalGrade('copy', 0)} );
      $new_mark_copy_link2.click(function(e){ e.preventDefault(); EG.newProvisionalGrade('copy', 1)} );

      function makeFullWidth(){
        $full_width_container.addClass("full_width");
        $left_side.css("width",'');
        $right_side.css("width",'');
      }
      $(document).mouseup(function(event){
        $resize_overlay.hide();
      });
      // it should disappear before it's clickable, but just in case...
      $resize_overlay.click(function(event){
        $(this).hide();
      });
      $width_resizer.mousedown(function(event){
        $resize_overlay.show();
      }).draggable({
        axis: 'x',
        cursor: 'crosshair',
        scroll: false,
        containment: '#full_width_container',
        snap: '#full_width_container',
        appendTo: '#full_width_container',
        helper: function(){
          return $width_resizer.clone().addClass('clone');
        },
        snapTolerance: 200,
        drag: function(event, ui) {
          var offset = ui.offset,
              windowWidth = $window.width();
          $left_side.width(offset.left / windowWidth * 100 + "%" );
          $right_side.width(100 - offset.left / windowWidth  * 100 + '%' );
          $width_resizer.css("left","0");
          if (windowWidth - offset.left < $(this).draggable('option', 'snapTolerance') ) {
            makeFullWidth();
          }
          else {
            $full_width_container.removeClass("full_width");
          }
          if (offset.left < $(this).draggable('option', 'snapTolerance')) {
            $left_side.width("0%" );
            $right_side.width('100%');
          }
        },
        stop: function(event, ui) {
          event.stopImmediatePropagation();
          $resize_overlay.hide();
        }
      }).click(function(event){
          event.preventDefault();
          if ($full_width_container.hasClass("full_width")) {
            $full_width_container.removeClass("full_width");
          }
          else {
            makeFullWidth();
            $(this).addClass('highlight', 100, function(){
              $(this).removeClass('highlight', 4000);
            });
          }
      });

      $grade.change(EG.handleGradeSubmit);

      $multiple_submissions.change(function(e) {
        if (typeof EG.currentStudent.submission == 'undefined') EG.currentStudent.submission = {};
        var i = $("#submission_to_view").val() ||
                EG.currentStudent.submission.submission_history.length - 1;
        EG.currentStudent.submission.currentSelectedIndex = parseInt(i, 10);
        EG.handleSubmissionSelectionChange();
      });

      initRubricStuff();
      initCommentBox();
      EG.initComments();
      header.init();
      initKeyCodes();

      $('.dismiss_alert').click(function(e){
        e.preventDefault();
        $(this).closest(".alert").hide();
      });

      $window.bind('hashchange', EG.handleFragmentChange);
      $('#eg_sort_by').val(userSettings.get('eg_sort_by'));
      $('#submit_same_score').click(function(e) {
        EG.handleGradeSubmit();
        e.preventDefault();
      });

      window.onbeforeunload = beforeLeavingSpeedgrader;
    },

    jsonReady: function(){
      //this runs after the request to get the jsonData comes back

      mergeStudentsAndSubmission();
      if (jsonData.GROUP_GRADING_MODE && !jsonData.studentsWithSubmissions.length) {
        if (window.history.length === 1) {
          alert(I18n.t('alerts.no_students_in_groups_close', "Sorry, submissions for this assignment cannot be graded in Speedgrader because there are no assigned users. Please assign users to this group set and try again. Click 'OK' to close this window."))
          window.close();
        }
        else {
          alert(I18n.t('alerts.no_students_in_groups_back', "Sorry, submissions for this assignment cannot be graded in Speedgrader because there are no assigned users. Please assign users to this group set and try again. Click 'OK' to go back."))
          window.history.back();
        }
      }
      else if (!jsonData.studentsWithSubmissions.length) {
        alert(I18n.t('alerts.no_active_students', "Sorry, there are either no active students in the course or none are gradable by you."))
        window.history.back();
      } else {
        $("#speed_grader_loading").hide();
        $("#gradebook_header, #full_width_container").show();
        initDropdown();
        initGroupAssignmentMode();
        EG.handleFragmentChange();
      }
    },

    skipRelativeToCurrentIndex: function(offset){
      var newIndex = (this.currentIndex() + offset+ jsonData.studentsWithSubmissions.length) % jsonData.studentsWithSubmissions.length;
      this.goToStudent(jsonData.studentsWithSubmissions[newIndex].id);
    },

    next: function(){
      this.skipRelativeToCurrentIndex(1);
      var studentInfo = this.getStudentNameAndGrade();
      $("#aria_name_alert").text(studentInfo);
    },

    prev: function(){
      this.skipRelativeToCurrentIndex(-1);
      var studentInfo = this.getStudentNameAndGrade();
      $("#aria_name_alert").text(studentInfo);
    },

    getStudentNameAndGrade: function(){
      var hideStudentNames = utils.shouldHideStudentNames();
      var studentName = hideStudentNames ? I18n.t('student_index', "Student %{index}", { index: EG.currentIndex() + 1 }) : EG.currentStudent.name;
      var submissionStatus = classNameBasedOnStudent(EG.currentStudent);
      return studentName + " - " + submissionStatus.formatted;
    },

    toggleFullRubric: function(force){
      // if there is no rubric associated with this assignment, then the edit
      // rubric thing should never be shown.  the view should make sure that
      // the edit rubric html is not even there but we also want to make sure
      // that pressing "r" wont make it appear either
      if (!jsonData.rubric_association){ return false; }

      if ($rubric_full.filter(":visible").length || force === "close") {
        $("#grading").height("auto").children().show();
        $rubric_full.fadeOut();
        $(".toggle_full_rubric").focus()
      } else {
        $rubric_full.fadeIn();
        $("#grading").children().hide();
        this.refreshFullRubric();
        $rubric_full.find('.rubric_title .title').focus()
      }
    },

    refreshFullRubric: function() {
      if (!jsonData.rubric_association) { return; }
      if (!$rubric_full.filter(":visible").length) { return; }

      rubricAssessment.populateRubric($rubric_full.find(".rubric"), getSelectedAssessment() );
      $("#grading").height($rubric_full.height());
    },

    handleFragmentChange: function(){
      var hash;
      try {
        hash = JSON.parse(decodeURIComponent(document.location.hash.substr(1))); //get rid of the first charicter "#" of the hash
      } catch(e) {}
      if (!hash) {
        hash = {};
      }

      // use the group representative if possible
      var studentId = jsonData.context.rep_for_student[hash.student_id] ||
                      hash.student_id;

      // choose the first ungraded student if the requested one doesn't exist
      if (!jsonData.studentMap[studentId]) {
        var ungradedStudent = _(jsonData.studentsWithSubmissions)
        .find(function(s) {
          return s.submission &&
                 s.submission.workflow_state != 'graded' &&
                 s.submission.submission_type;
        });
        studentId = (ungradedStudent || jsonData.studentsWithSubmissions[0]).id;
      }

      if (hash.provisional_grade_id) {
        EG.selected_provisional_grade_id = hash.provisional_grade_id;
      }
      EG.goToStudent(studentId);
    },

    goToStudent: function(student_id){
      var hideStudentNames = utils.shouldHideStudentNames();
      var student = jsonData.studentMap[student_id];

      if (student) {
        $selectmenu.jquerySelectMenu().selectmenu("value", student.id);
        //this is lame but I have to manually tell $selectmenu to fire its 'change' event if has changed.
        if (!this.currentStudent || (this.currentStudent.id != student.id)) {
          $selectmenu.jquerySelectMenu().change();
        }
        if (student.avatar_path && !hideStudentNames) {
          // If there's any kind of delay in loading the user's avatar, it's
          // better to show a blank image than the previous student's image.
          $new_image = $avatar_image.clone().show();
          $avatar_image.after($new_image.attr('src', student.avatar_path)).remove();
          $avatar_image = $new_image;
        } else {
          $avatar_image.hide();
        }
      }
    },

    currentIndex: function(){
      return $.inArray(this.currentStudent, jsonData.studentsWithSubmissions);
    },

    handleStudentChanged: function(){
      var id = $selectmenu.jquerySelectMenu().val();
      this.currentStudent = jsonData.studentMap[id] || _.values(jsonData.studentsWithSubmissions)[0];
      document.location.hash = "#" + encodeURIComponent(JSON.stringify({
          "student_id": this.currentStudent.id
        }));

      if ((ENV.grading_role == 'provisional_grader' && this.currentStudent.submission_state == 'not_graded')
        || ENV.grading_role == 'moderator') {

        $(".speedgrader_alert").hide();
        $submission_not_newest_notice.hide();
        $submission_late_notice.hide();

        $grade.attr('disabled', true); // disabling now will keep it from getting undisabled unintentionally by disableWhileLoading
        if (ENV.grading_role == 'moderator' && this.currentStudent.submission_state == 'not_graded') {
          this.currentStudent.submission.grade = null; // otherwise it may be tricked into showing the wrong submission_state
        }

        var status_url = ENV.provisional_status_url + "?student_id=" + this.currentStudent.id;
        if (ENV.grading_role == 'moderator') {
          status_url += "&last_updated_at="
          if (this.currentStudent.submission) status_url += this.currentStudent.submission.updated_at;
        }

        // hit the API to check whether we still can give a provisional grade
        $full_width_container.disableWhileLoading(
          $.getJSON(status_url, {}, function(data) {
            EG.currentStudent.needs_provisional_grade = data.needs_provisional_grade;

            if (ENV.grading_role == 'moderator' && data.provisional_grades) {
              if (!EG.currentStudent.submission) EG.currentStudent.submission = {}
              EG.currentStudent.submission.provisional_grades = data.provisional_grades;
              EG.currentStudent.submission.updated_at = data.updated_at;
              EG.currentStudent.submission.final_provisional_grade = data.final_provisional_grade;
            }

            EG.currentStudent.submission_state = submissionState(EG.currentStudent);
            EG.showStudent();
          })
        );
      } else {
        this.showStudent();
      }
    },
    showStudent: function(){
      $rightside_inner.scrollTo(0);
      if (this.currentStudent.submission_state == 'not_gradeable' && ENV.grading_role == "provisional_grader") {
        $rightside_inner.hide();
        $not_gradeable_message.show();
      } else {
        $not_gradeable_message.hide();
        $rightside_inner.show();
      }
      if (ENV.grading_role == "moderator") {
        this.current_prov_grade_index = null;
        this.handleModerationTabs(0); // sets up tabs and loads first grade
      } else {
        this.showSubmission();
      }
    },
    showSubmission: function(){
      this.showGrade();
      this.showDiscussion();
      this.showRubric();
      this.updateStatsInHeader();
      this.showSubmissionDetails();
      this.refreshFullRubric();
    },
    handleModerationTabs: function(index_to_load) {
      var prov_grades = this.currentStudent.submission && this.currentStudent.submission.provisional_grades;
      var final_grade = this.currentStudent.submission && this.currentStudent.submission.final_provisional_grade;

      if (prov_grades && prov_grades.length == 1 && !final_grade && !prov_grades[0].readonly) {
        $full_width_container.removeClass("with_moderation_tabs");
        $moderation_tabs_div.hide();
        EG.showProvisionalGrade(0);
      } else if (prov_grades && prov_grades.length > 0) {
        if (prov_grades.length == 1) {
          $moderation_tab_2nd.hide(); // hide 2nd mark

          if (this.currentStudent.needs_provisional_grade || final_grade) {
            $new_mark_container.show();
            $new_mark_copy_link2.hide(); // hide copy 2nd mark
            if (final_grade) {
              $new_mark_link.hide();
            } else {
              $new_mark_link.show();
            }
          } else {
            $new_mark_container.hide(); // hide new mark dropdown if not selected for moderation
          }
        } else if (prov_grades.length == 2) {
          $moderation_tab_2nd.show();
          $new_mark_container.show();
          $new_mark_link.hide();
          if (prov_grades[1].provisional_grade_id) {
            $new_mark_copy_link2.show(); // show copy 2nd mark
          } else {
            $new_mark_copy_link2.hide(); // don't show if it's a new unsaved mark
          }
        }

        if (final_grade) {
          $moderation_tab_final.show();
          $new_mark_final_link.hide();
        } else {
          $moderation_tab_final.hide();
          $new_mark_final_link.show();
        }

        $full_width_container.addClass("with_moderation_tabs");
        $moderation_tabs_div.show();

        if (this.selected_provisional_grade_id) {
          var selected_id = this.selected_provisional_grade_id;
          // load provisional grade id from anchor hash

          if (final_grade && final_grade.provisional_grade_id == selected_id) {
            index_to_load = 'final'; // final mark
          } else {
            $.each(prov_grades, function (idx, pg) {
              if (pg.provisional_grade_id == selected_id) {
                index_to_load = idx;
              }
            });
          }

          this.selected_provisional_grade_id = null; // don't load it again
        }

        if (index_to_load == 'final') {
          $moderation_tab_final.find('a').click();
        } else {
          $moderation_tabs.eq(index_to_load).find('a').click(); // show a grade
        }
      } else {
        $full_width_container.removeClass("with_moderation_tabs");
        $moderation_tabs_div.hide();
        this.showSubmission();
        this.setReadOnly(false);
      }
    },
    updateModerationTabs: function() {
      if (!this.currentStudent.submission) return;
      var prov_grades = this.currentStudent.submission.provisional_grades;

      this.updateModerationTab($moderation_tabs.eq(0), prov_grades && prov_grades[0]);
      this.updateModerationTab($moderation_tabs.eq(1), prov_grades && prov_grades[1]);
      this.updateModerationTab($moderation_tab_final, this.currentStudent.submission.final_provisional_grade);
    },
    updateModerationTab: function($tab, prov_grade) {
      if (prov_grade && prov_grade.selected) {
        $tab.addClass('selected');
      } else {
        $tab.removeClass('selected');
      }

      if (prov_grade && prov_grade.provisional_grade_id) {
        $tab.removeClass('pending');
      } else {
        $tab.addClass('pending');
      }

      var $mark_grade = $tab.find('.mark_grade');
      if (prov_grade && prov_grade.score) {
        $mark_grade.html(htmlEscape(prov_grade.score + "/" + jsonData.points_possible));
      } else {
        $mark_grade.empty();
      }
    },
    showProvisionalGrade: function(idx) {
      if (this.current_prov_grade_index != idx) {

        this.current_prov_grade_index = idx;
        var prov_grade;
        if (idx == 'final') {
          prov_grade = this.currentStudent.submission.final_provisional_grade;
        } else {
          prov_grade = this.currentStudent.submission.provisional_grades[idx];
        }

        // merge in the provisional attributes
        $.extend(this.currentStudent.submission, prov_grade);

        this.currentStudent.rubric_assessments = prov_grade.rubric_assessments;
        this.currentStudent.provisional_crocodoc_urls = prov_grade.crocodoc_urls;
        this.showSubmission();

        // set read-only if needed
        this.setReadOnly(prov_grade.readonly);
      }
    },
    newProvisionalGrade: function(type, index) {
      if (type == 'new')  {
        var new_mark = {
          'grade': null,
          'score': null,
          'graded_at': null,
          'final': false,
          'grade_matches_current_submission': true,
          'scorer_id': ENV.current_user_id,
          'rubric_assessments': []
        };
        if (index == 1) {
          this.currentStudent.submission.provisional_grades.push(new_mark);
          this.handleModerationTabs(1);
        } else if (index == 'final') {
          this.currentStudent.submission.final_provisional_grade = new_mark;
          this.handleModerationTabs('final');
        }
      } else if (type == 'copy') {
        if (!this.currentStudent.submission.final_provisional_grade ||
          confirm(I18n.t("Are you sure you want to copy to the final mark? This will overwrite the existing mark."))) {
          var grade_to_copy = this.currentStudent.submission.provisional_grades[index];
          $full_width_container.disableWhileLoading(
            $.ajaxJSON($.replaceTags(ENV.provisional_copy_url, {provisional_grade_id: grade_to_copy.provisional_grade_id}), "POST",  {}, function(data) {
              $.each(EG.currentStudent.submission.provisional_grades, function(i, pg) { pg.selected = false; });

              EG.currentStudent.submission.final_provisional_grade = data;
              EG.currentStudent.submission_state = submissionState(EG.currentStudent);
              EG.current_prov_grade_index = null;
              EG.handleModerationTabs('final');
              EG.updateModerationTabs();
            })
          );
        }
      }
    },
    selectProvisionalGrade: function(index) {
      var prov_grade;
      if (index == 'final') {
        prov_grade = this.currentStudent.submission.final_provisional_grade;
      } else {
        prov_grade = this.currentStudent.submission.provisional_grades[index];
      }
      $full_width_container.disableWhileLoading(
        $.ajaxJSON($.replaceTags(ENV.provisional_select_url, {provisional_grade_id: prov_grade.provisional_grade_id}), "PUT",  {}, function(data) {
          $.each(EG.currentStudent.submission.provisional_grades, function(i, pg) { pg.selected = false; });
          if (EG.currentStudent.submission.final_provisional_grade) {
            EG.currentStudent.submission.final_provisional_grade.selected = false;
          }
          prov_grade.selected = true;
          EG.updateModerationTabs();
        })
      );
    },
    setReadOnly: function(readonly) {
      if (readonly) {
        $grade.attr('disabled', true);
        $comments.find(".delete_comment_link").hide();
        $add_a_comment.hide();
      } else {
        // $grade will be disabled/enabled in showGrade()
        // $comments will be reconstructed
        $add_a_comment.show();
      }
    },
    populateTurnitin: function(submission, assetString, turnitinAsset, $turnitinScoreContainer, $turnitinInfoContainer, isMostRecent) {
      var $turnitinSimilarityScore = null;

      // build up new values based on this asset
      if (turnitinAsset.status == 'scored' || (turnitinAsset.status == null && turnitinAsset.similarity_score != null)) {
        $turnitinScoreContainer.html(turnitinScoreTemplate({
          state: (turnitinAsset.state || 'no') + '_score',
          reportUrl: $.replaceTags($assignment_submission_turnitin_report_url.attr('href'), { user_id: submission.user_id, asset_string: assetString }),
          tooltip: I18n.t('turnitin.tooltip.score', 'Turnitin Similarity Score - See detailed report'),
          score: turnitinAsset.similarity_score + '%'
        }));
      } else if (turnitinAsset.status) {
        // status == 'error' or status == 'pending'
        var pendingTooltip = I18n.t('turnitin.tooltip.pending', 'Turnitin Similarity Score - Submission pending'),
            errorTooltip = I18n.t('turnitin.tooltip.error', 'Turnitin Similarity Score - See submission error details');
        $turnitinSimilarityScore = $(turnitinScoreTemplate({
          state: 'submission_' + turnitinAsset.status,
          reportUrl: '#',
          tooltip: (turnitinAsset.status == 'error' ? errorTooltip : pendingTooltip),
          icon: '/images/turnitin_submission_' + turnitinAsset.status + '.png'
        }));
        $turnitinScoreContainer.append($turnitinSimilarityScore);
        $turnitinSimilarityScore.click(function(event) {
          event.preventDefault();
          $turnitinInfoContainer.find('.turnitin_'+assetString).slideToggle();
        });

        var defaultInfoMessage = I18n.t('turnitin.info_message',
                                        'This file is still being processed by turnitin. Please check back later to see the score'),
            defaultErrorMessage = I18n.t('turnitin.error_message',
                                         'There was an error submitting to turnitin. Please try resubmitting the file before contacting support');
        var $turnitinInfo = $(turnitinInfoTemplate({
          assetString: assetString,
          message: (turnitinAsset.status == 'error' ? (turnitinAsset.public_error_message || defaultErrorMessage) : defaultInfoMessage),
          showResubmit: turnitinAsset.status == 'error' && isMostRecent
        }));
        $turnitinInfoContainer.append($turnitinInfo);

        if (turnitinAsset.status == 'error' && isMostRecent) {
          var resubmitUrl = $.replaceTags($assignment_submission_resubmit_to_turnitin_url.attr('href'), { user_id: submission.user_id });
          $turnitinInfo.find('.turnitin_resubmit_button').click(function(event) {
            event.preventDefault();
            $(this).attr('disabled', true)
              .text(I18n.t('turnitin.resubmitting', 'Resubmitting...'));

            $.ajaxJSON(resubmitUrl, "POST", {}, function() {
              window.location.reload();
            });
          });
        }
      }
    },

    handleSubmissionSelectionChange: function(){
      clearInterval(crocodocSessionTimer);
      var $submission_to_view = $("#submission_to_view");
      var submissionToViewVal = $submission_to_view.val(),
          currentSelectedIndex = Number(submissionToViewVal) ||
                                ( this.currentStudent &&
                                  this.currentStudent.submission &&
                                  this.currentStudent.submission.currentSelectedIndex )
                                || 0,
          isMostRecent = this.currentStudent &&
                         this.currentStudent.submission &&
                         this.currentStudent.submission.submission_history &&
                         this.currentStudent.submission.submission_history.length - 1 === currentSelectedIndex,
          submission  = this.currentStudent &&
                        this.currentStudent.submission &&
                        this.currentStudent.submission.submission_history &&
                        this.currentStudent.submission.submission_history[currentSelectedIndex] &&
                        this.currentStudent.submission.submission_history[currentSelectedIndex].submission
                        || {},
          inlineableAttachments = [],
          browserableAttachments = [];

      var $turnitinScoreContainer = $grade_container.find(".turnitin_score_container").empty(),
          $turnitinInfoContainer = $grade_container.find(".turnitin_info_container").empty(),
          assetString = 'submission_' + submission.id,
          turnitinAsset = submission.turnitin_data && submission.turnitin_data[assetString];
      // There might be a previous submission that was text_entry, but the
      // current submission is an upload. The turnitin asset for the text
      // entry would still exist
      if (turnitinAsset && submission.submission_type == 'online_text_entry') {
        EG.populateTurnitin(submission, assetString, turnitinAsset, $turnitinScoreContainer, $turnitinInfoContainer, isMostRecent);
      }

      //handle the files
      $submission_files_list.empty();
      $turnitinInfoContainer = $("#submission_files_container .turnitin_info_container").empty();
      $.each(submission.versioned_attachments || [], function(i,a){
        var attachment = a.attachment;
        if (attachment.crocodoc_url && EG.currentStudent.provisional_crocodoc_urls) {
          attachment.provisional_crocodoc_url = _.find(EG.currentStudent.provisional_crocodoc_urls, function(url) {
            return url.attachment_id == attachment.id;
          }).crocodoc_url;
        } else {
          attachment.provisional_crocodoc_url = null;
        }
        if (attachment.crocodoc_url ||
            attachment.canvadoc_url ||
            $.isPreviewable(attachment.content_type, 'google')) {
          inlineableAttachments.push(attachment);
        }
        if (browserableCssClasses.test(attachment.mime_class)) {
          browserableAttachments.push(attachment);
        }
        $submission_file = $submission_file_hidden.clone(true).fillTemplateData({
          data: {
            submissionId: submission.user_id,
            attachmentId: attachment.id,
            display_name: attachment.display_name
          },
          hrefValues: ['submissionId', 'attachmentId']
        }).appendTo($submission_files_list)
          .find('a.display_name')
            .addClass(attachment.mime_class)
            .data('attachment', attachment)
            .click(function(event){
              event.preventDefault();
              EG.loadAttachmentInline($(this).data('attachment'));
            })
          .end()
          .find('a.submission-file-download')
            .bind('dragstart', function(event){
              // check that event dataTransfer exists
              event.originalEvent.dataTransfer &&
              // handle dragging out of the browser window only if it is supported.
              event.originalEvent.dataTransfer.setData('DownloadURL', attachment.content_type + ':' + attachment.filename + ':' + this.href);
            })
          .end()
          .show();
        $turnitinScoreContainer = $submission_file.find(".turnitin_score_container");
        assetString = 'attachment_' + attachment.id;
        turnitinAsset = submission.turnitin_data && submission.turnitin_data[assetString];
        if (turnitinAsset) {
          EG.populateTurnitin(submission, assetString, turnitinAsset, $turnitinScoreContainer, $turnitinInfoContainer, isMostRecent);
        }
      });

      $submission_files_container.showIf(submission.versioned_attachments && submission.versioned_attachments.length);

      // load up a preview of one of the attachments if we can.
      // do it in this order:
      // show the first scridbable doc if there is one
      // then show the first image if there is one,
      // if not load the generic thing for the current submission (by not passing a value)
      this.loadAttachmentInline(inlineableAttachments[0] || browserableAttachments[0]);

      // if there is any submissions after this one, show a notice that they are not looking at the newest
      $submission_not_newest_notice.showIf($submission_to_view.filter(":visible").find(":selected").nextAll().length);

      // if the submission was after the due date, mark it as late
      $submission_late_notice.showIf(submission['late']);
    },

    refreshSubmissionsToView: function(){
      var innerHTML = "";
      var s = this.currentStudent.submission;
      var submissionHistory = s.submission_history;

      if (submissionHistory.length > 0) {
        var noSubmittedAt = I18n.t('no_submission_time', 'no submission time');
        var selectedIndex = parseInt($("#submission_to_view").val() ||
                                       submissionHistory.length - 1,
                                     10);
        var templateSubmissions = _(submissionHistory).map(function(o, i) {
          var s = o.submission;
          if (s.grade && (s.grade_matches_current_submission ||
                          s.show_grade_in_dropdown)) {
            var grade = s.grade;
          }
          return {
            value: s.version || i,
            late: s.late,
            selected: selectedIndex === i,
            submittedAt: $.datetimeString(s.submitted_at) || noSubmittedAt,
            grade: grade
          };
        });

        innerHTML = submissionsDropdownTemplate({
          singleSubmission: submissionHistory.length == 1,
          submissions: templateSubmissions,
          linkToQuizHistory: jsonData.too_many_quiz_submissions,
          quizHistoryHref: $.replaceTags(ENV.quiz_history_url,
                                         {user_id: this.currentStudent.id})
        });
      }
      $multiple_submissions.html($.raw(innerHTML));
    },

    showSubmissionDetails: function(){
      //if there is a submission
      var currentSubmission = this.currentStudent.submission;
      if (currentSubmission && currentSubmission.submitted_at) {
        this.refreshSubmissionsToView();
        var lastIndex = currentSubmission.submission_history.length - 1;
        $("#submission_to_view option:eq(" + lastIndex + ")").attr("selected", "selected");
        $submission_details.show();
      }
      else { //there's no submission
        $submission_details.hide();
      }
      this.handleSubmissionSelectionChange();
    },

    updateStatsInHeader: function(){
      $x_of_x_students.text(
        I18n.t('gradee_index_of_total', '%{gradee} %{x} of %{y}', {
          gradee: gradeeLabel,
          x: EG.currentIndex() + 1,
          y: this.totalStudentCount()
        })
      );

      var gradedStudents = $.grep(jsonData.studentsWithSubmissions, function(s) {
        return (s.submission_state == 'graded' || s.submission_state == 'not_gradeable');
      });

      var scores = $.map(gradedStudents , function(s){
        return s.submission.score;
      });

      if (scores.length) { //if there are some submissions that have been graded.
        $average_score_wrapper.show();
        function avg(arr) {
          var sum = 0;
          for (var i = 0, j = arr.length; i < j; i++) {
            sum += arr[i];
          }
          return sum / arr.length;
        }
        function roundWithPrecision(number, precision) {
          precision = Math.abs(parseInt(precision, 10)) || 0;
          var coefficient = Math.pow(10, precision);
          return Math.round(number*coefficient)/coefficient;
        }
        var outOf = jsonData.points_possible ? ([" / ", jsonData.points_possible, " (", Math.round( 100 * (avg(scores) / jsonData.points_possible)), "%)"].join("")) : "";
        $average_score.text( [roundWithPrecision(avg(scores), 2) + outOf].join("") );
      }
      else { //there are no submissions that have been graded.
        $average_score_wrapper.hide();
      }

      $grded_so_far.text(
        I18n.t('portion_graded', '%{x} / %{y} Graded', {
          x: gradedStudents.length,
          y: jsonData.context.students.length
        })
      );
    },

    totalStudentCount: function(){
      if (sectionToShow) {
        return _.filter(jsonData.context.students, function(student) {return _.contains(student.section_ids, sectionToShow)}).length;
      } else {
        return jsonData.context.students.length;
      };
    },

    loadAttachmentInline: function(attachment){
      clearInterval(crocodocSessionTimer);
      $submissions_container.children().hide();
      $(".speedgrader_alert").hide();
      if (!this.currentStudent.submission || !this.currentStudent.submission.submission_type || this.currentStudent.submission.workflow_state == 'unsubmitted') {
          $this_student_does_not_have_a_submission.show();
      } else if (this.currentStudent.submission && this.currentStudent.submission.submitted_at && jsonData.context.quiz && jsonData.context.quiz.anonymous_submissions) {
          $this_student_has_a_submission.show();
      } else {
        $iframe_holder.empty();

        if (attachment) {
          var previewOptions = {
            height: '100%',
            id: "speedgrader_iframe",
            mimeType: attachment.content_type,
            attachment_id: attachment.id,
            submission_id: this.currentStudent.submission.id,
            attachment_view_inline_ping_url: attachment.view_inline_ping_url,
            attachment_preview_processing: attachment.workflow_state == 'pending_upload' || attachment.workflow_state == 'processing'
          };
        }

        if (attachment &&
            attachment.submitted_to_crocodoc && !attachment.crocodoc_url) {
          $("#crocodoc_pending").show();
        }

        if (attachment && attachment.crocodoc_url) {
          var crocodocStart = new Date()
          ,   sessionLimit = 60 * 60 * 1000
          ,   aggressiveWarnings = [50 * 60 * 1000,
                                    55 * 60 * 1000,
                                    58 * 60 * 1000,
                                    59 * 60 * 1000];
          crocodocSessionTimer = window.setInterval(function() {
            var elapsed = new Date() - crocodocStart;
            if (elapsed > sessionLimit) {
              window.location.reload();
            } else if (elapsed > aggressiveWarnings[0]) {
              alert(I18n.t("crocodoc_expiring",
                           "Your Crocodoc session is expiring soon.  Please reload " +
                           "the window to avoid losing any work."));
              aggressiveWarnings.shift();
            }
          }, 1000);

          $iframe_holder.show().loadDocPreview($.extend(previewOptions, {
            crocodoc_session_url: (attachment.provisional_crocodoc_url || attachment.crocodoc_url)
          }));
        }
        else if (attachment && attachment.canvadoc_url) {
          $iframe_holder.show().loadDocPreview($.extend(previewOptions, {
            canvadoc_session_url: attachment.canvadoc_url
          }));
        }
        else if ( attachment && ($.isPreviewable(attachment.content_type, 'google')) ) {
          if (!INST.disableCrocodocPreviews) $no_annotation_warning.show();

          var currentStudentIDAsOfAjaxCall = this.currentStudent.id;
          previewOptions = $.extend(previewOptions, {
              ajax_valid: _.bind(function() {
                return(currentStudentIDAsOfAjaxCall == this.currentStudent.id);
              },this)});
          $iframe_holder.show().loadDocPreview(previewOptions);
	      }
	      else if (attachment && browserableCssClasses.test(attachment.mime_class)) {
	        var src = unescape($submission_file_hidden.find('.display_name').attr('href'))
	                  .replace("{{submissionId}}", this.currentStudent.submission.user_id)
	                  .replace("{{attachmentId}}", attachment.id);
	        $iframe_holder.html('<iframe src="'+htmlEscape(src)+'" frameborder="0" id="speedgrader_iframe"></iframe>').show();
	      }
	      else {
	        //load in the iframe preview.  if we are viewing a past version of the file pass the version to preview in the url
	        $iframe_holder.html($.raw(
            '<iframe id="speedgrader_iframe" src="' + htmlEscape('/courses/' + jsonData.context_id  +
            '/assignments/' + this.currentStudent.submission.assignment_id +
            '/submissions/' + this.currentStudent.submission.user_id +
            '?preview=true' + (

              this.currentStudent.submission &&
              !isNaN(this.currentStudent.submission.currentSelectedIndex) &&
              this.currentStudent.submission.currentSelectedIndex != null ?
              '&version=' + this.currentStudent.submission.currentSelectedIndex :
              ''
            ) + (
              utils.shouldHideStudentNames() ? "&hide_student_name=1" : ""
            )) + '" frameborder="0"></iframe>'))
            .show();
	      }
  	  }
    },

    showRubric: function(){
      //if this has some rubric_assessments
      if (jsonData.rubric_association) {
        ENV.RUBRIC_ASSESSMENT.assessment_user_id = this.currentStudent.id;

        var assessmentsByMe = $.grep(EG.currentStudent.rubric_assessments, function(n,i){
          return n.assessor_id === ENV.RUBRIC_ASSESSMENT.assessor_id;
        });
        var gradingAssessments = $.grep(EG.currentStudent.rubric_assessments, function(n,i){
          return n.assessment_type == 'grading';
        });

        $rubric_assessments_select.find("option").remove();
        $.each(this.currentStudent.rubric_assessments, function(){
          $rubric_assessments_select.append('<option value="' + htmlEscape(this.id) + '">' + htmlEscape(this.assessor_name) + '</option>');
        });

        //select the assessment that meets these rules:
        // 1. the assessment by me
        // 2. the assessment with assessment_type = 'grading'
        var idToSelect = null;
        if (gradingAssessments.length) {
          idToSelect = gradingAssessments[0].id;
        }
        if (assessmentsByMe.length) {
          idToSelect = assessmentsByMe[0].id;
        }
        if (idToSelect) {
          $rubric_assessments_select.val(idToSelect);
        }

        // hide the select box if there is not >1 option
        $("#rubric_assessments_list").showIf($rubric_assessments_select.find("option").length > 1);
        $rubric_assessments_select.change();
      }
    },

    showDiscussion: function(){
      var hideStudentNames = utils.shouldHideStudentNames();
      $comments.html("");
      if (this.currentStudent.submission && this.currentStudent.submission.submission_comments) {
        $.each(this.currentStudent.submission.submission_comments, function(i, comment){
          // Serialization seems to have changed... not sure if it's changed everywhere, though...
          if(comment.submission_comment) { comment = comment.submission_comment; }
          comment.posted_at = $.datetimeString(comment.created_at);

          var hideStudentName = hideStudentNames && jsonData.studentMap[comment.author_id];
          if (hideStudentName) { comment.author_name = I18n.t('student', "Student"); }
          var $comment = $comment_blank.clone(true).fillTemplateData({ data: comment });
          $comment.find('span.comment').html($.raw(htmlEscape(comment.comment).replace(/\n/g, "<br />")));
          if (comment.avatar_path && !hideStudentName) {
            $comment.find(".avatar").attr('src', comment.avatar_path).show();
          }
          // this is really poorly decoupled but over in speed_grader.html.erb these rubricAssessment. variables are set.
          // what this is saying is: if I am able to grade this assignment (I am administrator in the course) or if I wrote this comment...
          var commentIsDeleteableByMe = ENV.RUBRIC_ASSESSMENT.assessment_type === "grading" ||
                                        ENV.RUBRIC_ASSESSMENT.assessor_id === comment.author_id;

          $comment.find(".delete_comment_link").click(function(event) {
            $(this).parents(".comment").confirmDelete({
              url: "/submission_comments/" + comment.id,
              message: I18n.t('confirms.delete_comment', "Are you sure you want to delete this comment?"),
              success: function(data) {
                $(this).slideUp(function() {
                  $(this).remove();
                });
              }
            });
          }).showIf(commentIsDeleteableByMe);

          if (comment.media_comment_type && comment.media_comment_id) {
            $comment.find(".play_comment_link").data(comment).show();
          }
          $.each((comment.cached_attachments || comment.attachments || []), function(){
            var attachment = this.attachment || this;
            attachment.comment_id = comment.id;
            attachment.submitter_id = EG.currentStudent.id;
            $comment.find(".comment_attachments").append($comment_attachment_blank.clone(true).fillTemplateData({
              data: attachment,
              hrefValues: ['comment_id', 'id', 'submitter_id']
            }).show().find("a").addClass(attachment.mime_class));
          });
          $comments.append($comment.show());
          $comments.find(".play_comment_link").mediaCommentThumbnail('normal');
        });
      }
      $comments.scrollTop(9999999);  //the scrollTop part forces it to scroll down to the bottom so it shows the most recent comment.
    },

    revertFromFormSubmit: function() {
        EG.showDiscussion();
        $add_a_comment_textarea.val("");
        // this is really weird but in webkit if you do $add_a_comment_textarea.val("").trigger('keyup') it will not let you
        // type it the textarea after you do that.  but I put it in a setTimeout it works.  so this is a hack for webkit,
        // but it still works in all other browsers.
        setTimeout(function(){ $add_a_comment_textarea.trigger('keyup'); }, 0);

        $add_a_comment.find(":input").prop("disabled", false);
        if (jsonData.GROUP_GRADING_MODE) {
          disableGroupCommentCheckbox();
        }

        $comment_submitted.show();
        $comment_submitted_message.attr("tabindex",-1).focus();
        $add_a_comment_submit_button.text(I18n.t('buttons.submit_comment', "Submit Comment"));
    },

    handleCommentFormSubmit: function(){
      $comment_submitted.hide();
      if (
        !$.trim($add_a_comment_textarea.val()).length &&
        !$("#media_media_recording").data('comment_id') &&
        !$add_a_comment.find("input[type='file']:visible").length
        ) {
          // that means that they did not type a comment, attach a file or record any media. so dont do anything.
        return false;
      }
      var url = assignmentUrl + "/submissions/" + EG.currentStudent.id;
      var method = "PUT";
      var formData = {
        'submission[assignment_id]': jsonData.id,
        'submission[user_id]': EG.currentStudent.id,
        'submission[group_comment]': ($("#submission_group_comment").attr('checked') ? "1" : "0"),
        'submission[comment]': $add_a_comment_textarea.val()
      };
      if ($("#media_media_recording").data('comment_id')) {
        $.extend(formData, {
          'submission[media_comment_type]': $("#media_media_recording").data('comment_type'),
          'submission[media_comment_id]': $("#media_media_recording").data('comment_id')
        });
      }
      if (ENV.grading_role == 'moderator' || ENV.grading_role == 'provisional_grader') {
        formData['submission[provisional]'] = true;
        if (ENV.grading_role == 'moderator' && EG.current_prov_grade_index == 'final') { // final mark
          formData['submission[final]'] = true;
        }
      }

      function formSuccess(submissions) {
        $.each(submissions, function(){
          EG.setOrUpdateSubmission(this.submission);
        });
        EG.revertFromFormSubmit();
        window.setTimeout(function() {
          $rightside_inner.scrollTo($rightside_inner[0].scrollHeight, 500);
        });
      }
      if($add_a_comment.find("input[type='file']:visible").length) {
        $.ajaxJSONFiles(url + ".text", method, formData, $add_a_comment.find("input[type='file']:visible"), formSuccess);
      } else {
        $.ajaxJSON(url, method, formData, formSuccess);
      }

      $("#comment_attachments").empty();
      $add_a_comment.find(":input").prop("disabled", true);
      $add_a_comment_submit_button.text(I18n.t('buttons.submitting', "Submitting..."));
      hideMediaRecorderContainer();
    },

    setOrUpdateSubmission: function(submission){

      // find the student this submission belongs to and update their submission with this new one, if they dont have a submission, set this as their submission.
      var student =  jsonData.studentMap[submission.user_id];
      if (!student) return;

      student.submission = student.submission || {};

      // stuff that comes back from ajax doesnt have a submission history but handleSubmissionSelectionChange
      // depends on it being there. so mimic it.
      if (typeof submission.submission_history === 'undefined') {
        submission.submission_history = [{
          submission: $.extend(true, {}, submission)
        }];
      }

      $.extend(true, student.submission, submission);

      student.submission_state = submissionState(student);
      if (ENV.grading_role == "moderator") {
        // sync with current provisional grade
        var prov_grade;
        if (this.current_prov_grade_index == 'final') {
          prov_grade = student.submission.final_provisional_grade;
        } else {
          prov_grade = student.submission.provisional_grades && student.submission.provisional_grades[this.current_prov_grade_index];
        }
        if (prov_grade) {
          if (!prov_grade.provisional_grade_id) {
            prov_grade.provisional_grade_id = submission.provisional_grade_id; // populate a new prov_grade's id
            this.updateModerationTabs();
            if (this.current_prov_grade_index == 1) {
              $new_mark_copy_link2.show(); // show the copy link now
            }
          }
          prov_grade.score = submission.score;
          prov_grade.grade = submission.grade;
          prov_grade.rubric_assessments = student.rubric_assessments;
          prov_grade.submission_comments = submission.submission_comments;
        }
      }

      return student;
    },
    handleGradeSubmit: function(){
      var url    = $(".update_submission_grade_url").attr('href'),
          method = $(".update_submission_grade_url").attr('title'),
          formData = {
            'submission[assignment_id]': jsonData.id,
            'submission[user_id]':       EG.currentStudent.id,
            'submission[graded_anonymously]': utils.shouldHideStudentNames()
          };
      var grade = $grade.val();
      if (grade.toUpperCase() === "EX") {
        formData["submission[excuse]"] = true;
      } else {
        formData["submission[grade]"] = grade;
      }
      if (ENV.grading_role == 'moderator' || ENV.grading_role == 'provisional_grader') {
        formData['submission[provisional]'] = true;
        if (ENV.grading_role == 'moderator' && EG.current_prov_grade_index == 'final') {
          formData['submission[final]'] = true;
        }
      }

      $.ajaxJSON(url, method, formData, function(submissions) {
        $.each(submissions, function(){
          EG.setOrUpdateSubmission(this.submission);
        });
        EG.refreshSubmissionsToView();
        $multiple_submissions.change();
        EG.showGrade();
      });
    },
    showGrade: function() {
      var submission;
      var grade = EG.currentStudent.submission === undefined ?
        "" :
        EG.currentStudent.submission.grade;

      if (EG.currentStudent.submission !== undefined) {
        submission = EG.currentStudent.submission;
        if (submission.excused) {
          grade = "EX"
        }
        else if (submission.grade !== null && !isNaN(parseFloat(submission.grade))) {
          grade = round(submission.grade, 2);
        }
      }

      $grade.val(grade)
        .attr('disabled', typeof submission != "undefined" &&
        submission.submission_type === 'online_quiz');

      $('#submit_same_score').hide();
      if (typeof submission != "undefined" && submission.score !== null) {
        $score.text(round(submission.score, round.DEFAULT));
        if (!submission.grade_matches_current_submission) {
          $('#submit_same_score').show();
        }
      } else {
        $score.text("");
      }

      if (ENV.grading_role == 'moderator') {
        EG.updateModerationTabs();
      }

      EG.updateStatsInHeader();

      // go through all the students and change the class of for each person in the selectmenu to reflect it has / has not been graded.
      // for the current student, you have to do it for both the li as well as the one that shows which was selected (AKA $selectmenu.data('selectmenu').newelement ).
      // this might be the wrong spot for this, it could be refactored into its own method and you could tell pass only certain students that you want to update
      // (ie the current student or all of the students in the group that just got graded)
      $.each(jsonData.studentsWithSubmissions, function(index, val) {
        var $query = $selectmenu.jquerySelectMenu().data('selectmenu').list.find("li:eq("+ index +")"),
            className = classNameBasedOnStudent(this),
            submissionStates = 'not_graded not_submitted graded resubmitted';

        if (this == EG.currentStudent) {
          $query = $query.add($selectmenu.jquerySelectMenu().data('selectmenu').newelement);
        }
        $query
          .removeClass(submissionStates)
          .addClass(className.raw)
          .find(".ui-selectmenu-item-footer")
            .text(className.formatted);

        $status = $(".ui-selectmenu-status");
        $statusIcon = $status.find(".speedgrader-selectmenu-icon");
        $queryIcon = $query.find(".speedgrader-selectmenu-icon");

        if(this == EG.currentStudent && (className.raw == "graded" || className.raw == "not_gradeable")){
          var studentInfo = EG.getStudentNameAndGrade()
          $("#students_selectmenu > option[value=" + this.id + "]").text(studentInfo);
          $queryIcon.text("").append("<i class='icon-check'></i>");
          $status.addClass("graded");
          $statusIcon.text("").append("<i class='icon-check'></i>");
        }else if(className.raw == "not_graded" && this == EG.currentStudent){
          var studentInfo = EG.getStudentNameAndGrade();
          $("#students_selectmenu > option[value=" + this.id + "]").text(studentInfo);
          $queryIcon.text("").append("&#9679;");
          $status.removeClass("graded");
          $statusIcon.text("").append("&#9679;");
        }else{
          $status.removeClass("graded");
        }

        // this is because selectmenu.js uses .data('optionClasses' on the li to keep track
        // of what class to put on the selected option ( aka: $selectmenu.data('selectmenu').newelement )
        // when this li is selected.  so even though we set the class of the li and the
        // $selectmenu.data('selectmenu').newelement when it is graded, we need to also set the data()
        // so that if you skip back to this student it doesnt show the old checkbox status.
        $.each(submissionStates.split(' '), function(){
          $query.data('optionClasses', $query.data('optionClasses').replace(this, ''));
        });
      });

    },

    initComments: function(){
      $add_a_comment_submit_button.click(function(event) {
        event.preventDefault();
        EG.handleCommentFormSubmit();
      });
      $add_attachment.click(function(event) {
        event.preventDefault();
        var $attachment = $comment_attachment_input_blank.clone(true);
        $attachment.find("input").attr('name', 'attachments[' + fileIndex + '][uploaded_data]');
        fileIndex++;
        $("#comment_attachments").append($attachment.show());
      });
      $comment_attachment_input_blank.find("a").click(function(event) {
        event.preventDefault();
        $(this).parents(".comment_attachment_input").remove();
      });
      $right_side.delegate(".play_comment_link", 'click', function() {
        if($(this).data('media_comment_id')) {
          $(this).parents(".comment").find(".media_comment_content").show().mediaComment('show', $(this).data('media_comment_id'), $(this).data('media_comment_type'));
        }
        return false; // so that it doesn't hit the $("a.instructure_inline_media_comment").live('click' event handler
      });
    }
  };

  //run the stuff that just attaches event handlers and dom stuff, but does not need the jsonData
  $(document).ready(function() {
    EG.domReady();
  });

});
